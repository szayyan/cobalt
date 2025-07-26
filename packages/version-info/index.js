import { existsSync }  from 'node:fs';
import { join, parse } from 'node:path';
import { cwd }         from 'node:process';
import { readFileSync }    from 'node:fs';

const findFile = (file) => {
    let dir = cwd();

    while (dir !== parse(dir).root) {
        if (existsSync(join(dir, file))) {
            return dir;
        }

        dir = join(dir, '../');
    }
}

const root = findFile('.git');
const pack = findFile('package.json');

const readGit = (filename) => {
    if (!root) {
        throw 'no git repository root found';
    }

    return readFileSync(join(root, filename), 'utf8');
}

export const getCommit = () => {
    return (readGit('.git/logs/HEAD'))
            ?.split('\n')
            ?.filter(String)
            ?.pop()
            ?.split(' ')[1];
}

export const getBranch = async () => {
    if (process.env.CF_PAGES_BRANCH) {
        return process.env.CF_PAGES_BRANCH;
    }

    if (process.env.WORKERS_CI_BRANCH) {
        return process.env.WORKERS_CI_BRANCH;
    }

    return (readGit('.git/HEAD'))
            ?.replace(/^ref: refs\/heads\//, '')
            ?.trim();
}

export const getRemote = () => {
    let remote = (readGit('.git/config'))
                    ?.split('\n')
                    ?.find(line => line.includes('url = '))
                    ?.split('url = ')[1];

    if (remote?.startsWith('git@')) {
        remote = remote.split(':')[1];
    } else if (remote?.startsWith('http')) {
        remote = new URL(remote).pathname.substring(1);
    }

    remote = remote?.replace(/\.git$/, '');

    if (!remote) {
        throw 'could not parse remote';
    }

    return remote;
}

export const getVersion = () => {
    if (!pack) {
        throw 'no package root found';
    }

    const { version } = JSON.parse(
        readFileSync(join(pack, 'package.json'), 'utf8')
    );

    return version;
}
