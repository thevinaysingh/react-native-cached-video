'use strict';

const _ = require('lodash');
const RNFetchBlob = require('react-native-fetch-blob').default;
const {
    fs
} = RNFetchBlob;

const baseCacheDir = fs.dirs.CacheDir + '/videosCacheDir';

const SHA1 = require("crypto-js/sha1");
const URL = require('url-parse');

const defaultHeaders = {};
const defaultVideoTypes = ['avi','asf', 'amv', 'flv', 'gif', 'mp4', 'mov', 'mpg', 'mkv', 'm4v', 'mpeg', 'm2v', 'mpv', 'mng', 'ogv', 'ogg', 'wmv', '3gp', 'webm' ];
const defaultResolveHeaders = _.constant(defaultHeaders);

const defaultOptions = {
    useQueryParamsInCacheKey: false
};

const activeDownloads = {};

function serializeObjectKeys(obj) {
    return _(obj)
        .toPairs()
        .sortBy(a => a[0])
        .map(a => a[1])
        .value();
}

function getQueryForCacheKey(url, useQueryParamsInCacheKey) {
    if (_.isArray(useQueryParamsInCacheKey)) {
        return serializeObjectKeys(_.pick(url.query, useQueryParamsInCacheKey));
    }
    if (useQueryParamsInCacheKey) {
        return serializeObjectKeys(url.query);
    }
    return '';
}

function generateCacheKey(url, options) {
    const parsedUrl = new URL(url, null, true);

    const pathParts = parsedUrl.pathname.split('/');

    // last path part is the file name
    const fileName = pathParts.pop();
    const filePath = pathParts.join('/');

    const parts = fileName.split('.');
    const fileType = parts.length > 1 ? _.toLower(parts.pop()) : '';
    const type = defaultVideoTypes.includes(fileType) ? fileType : 'mp4';

    const cacheable = filePath + fileName + type + getQueryForCacheKey(parsedUrl, options.useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getCachePath(url, options) {
    if (options.cacheGroup) {
        return options.cacheGroup;
    }
    const {
        host
    } = new URL(url);
    return host.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getCachedVideoFilePath(url, options) {
    const cachePath = getCachePath(url, options);
    const cacheKey = generateCacheKey(url, options);

    return `${baseCacheDir}/${cachePath}/${cacheKey}`;
}

function deleteFile(filePath) {
    return fs.stat(filePath)
        .then(res => res && res.type === 'file')
        .then(exists => exists && fs.unlink(filePath))
        .catch((err) => {
            // swallow error to always resolve
        });
}

function getDirPath(filePath) {
    return _.initial(filePath.split('/')).join('/');
}

function ensurePath(dirPath) {
    return fs.isDir(dirPath)
        .then(exists =>
            !exists && fs.mkdir(dirPath)
        )
        .catch(err => {
            // swallow folder already exists errors
            if (err.message.includes('folder already exists')) {
                return;
            }
            throw err;
        });
}

function downloadVideo(fromUrl, toFile, headers = {}) {
    // use toFile as the key as is was created using the cacheKey
    if (!_.has(activeDownloads, toFile)) {
        // create an active download for this file
        activeDownloads[toFile] = new Promise((resolve, reject) => {
            RNFetchBlob
                .config({path: toFile})
                .fetch('GET', fromUrl, headers)
                .then(res => {
                    if (Math.floor(res.respInfo.status / 100) !== 2) {
                        throw new Error('Failed to successfully download image');
                    }
                    resolve(toFile);
                })
                .catch(err => {
                    return deleteFile(toFile)
                        .then(() => reject(err));
                })
                .finally(() => {
                    // cleanup
                    delete activeDownloads[toFile];
                });
        });
    }
    return activeDownloads[toFile];
}

function createPrefetcer(list) {
    const urls = _.clone(list);
    return {
        next() {
            return urls.shift();
        }
    };
}

function runPrefetchTask(prefetcher, options) {
    const url = prefetcher.next();
    if (!url) {
        return Promise.resolve();
    }
    // if url is cacheable - cache it
    if (isCacheable(url)) {
        // check cache
        return getCachedVideoPath(url, options)
        // if not found download
            .catch(() => cacheVideo(url, options))
            // allow prefetch task to fail without terminating other prefetch tasks
            .catch(_.noop)
            // then run next task
            .then(() => runPrefetchTask(prefetcher, options));
    }
    // else get next
    return runPrefetchTask(prefetcher, options);
}

function collectFilesInfo(basePath) {
    return fs.stat(basePath)
        .then((info) => {
            if (info.type === 'file') {
                return [info];
            }
            return fs.ls(basePath)
                .then(files => {
                    const promises = _.map(files, file => {
                        return collectFilesInfo(`${basePath}/${file}`);
                    });
                    return Promise.all(promises);
                });
        })
        .catch(err => {
            return [];
        });
}

function isCacheable(url) {
    return _.isString(url) && (_.startsWith(url, 'http://') || _.startsWith(url, 'https://'));
}

function getCachedVideoPath(url, options = defaultOptions) {
    const filePath = getCachedVideoFilePath(url, options);
    return fs.stat(filePath)
        .then(res => {
            if (res.type !== 'file') {
                // reject the promise if res is not a file
                throw new Error('Failed to get image from cache');
            }
            if (!res.size) {
                // something went wrong with the download, file size is 0, remove it
                return deleteFile(filePath)
                    .then(() => {
                        throw new Error('Failed to get image from cache');
                    });
            }
            return filePath;
        })
        .catch(err => {
            throw err;
        })
}

function cacheVideo(url, options = defaultOptions, resolveHeaders = defaultResolveHeaders) {
    const filePath = getCachedVideoFilePath(url, options);
    const dirPath = getDirPath(filePath);
    return ensurePath(dirPath)
        .then(() => resolveHeaders())
        .then(headers => downloadVideo(url, filePath, headers));
}

function deleteCachedVideo(url, options = defaultOptions) {
    const filePath = getCachedVideoFilePath(url, options);
    return deleteFile(filePath);
}

function cacheMultipleVideos(urls, options = defaultOptions) {
    const prefetcher = createPrefetcer(urls);
    const numberOfWorkers = urls.length;
    const promises = _.times(numberOfWorkers, () =>
        runPrefetchTask(prefetcher, options)
    );
    return Promise.all(promises);
}

function deleteMultipleCachedVideos(urls, options = defaultOptions) {
    return _.reduce(urls, (p, url) =>
            p.then(() => deleteCachedVideo(url, options)),
        Promise.resolve()
    );
}

function seedCache(local, url, options = defaultOptions) {
  const filePath = getCachedVideoFilePath(url, options);
  const dirPath = getDirPath(filePath);
  return ensurePath(dirPath)
    .then(() => fs.cp(local, filePath))
}

function clearCache() {
    return fs.unlink(baseCacheDir)
        .catch(() => {
            // swallow exceptions if path doesn't exist
        })
        .then(() => ensurePath(baseCacheDir));
}

function getCacheInfo() {
    return ensurePath(baseCacheDir)
        .then(() => collectFilesInfo(baseCacheDir))
        .then(cache => {
            const files = _.flattenDeep(cache);
            const size = _.sumBy(files, 'size');
            return {
                files,
                size
            };
        });
}

module.exports = {
    isCacheable,
    getCachedVideoFilePath,
    getCachedVideoPath,
    cacheVideo,
    deleteCachedVideo,
    cacheMultipleVideos,
    deleteMultipleCachedVideos,
    clearCache,
    seedCache,
    getCacheInfo
};
