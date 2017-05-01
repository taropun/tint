// ==UserScript==
// @name         tint
// @namespace    http://github.com/taropun
// @version      0.1
// @description  Highlight large nhentai galleries
// @author       taropun
// @match        https://nhentai.net/
// @match        https://nhentai.net/?*
// @match        https://nhentai.net/search/?*
// @match        https://nhentai.net/*/*/*
// @exclude      https://nhentai.net/g/*
// @exclude      https://nhentai.net/users/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var green = 'rgba(27, 162, 43, 0.5)';
    var red = 'rgba(162, 27, 43, 0.5)';

    function parsePath(path) {
        return path.split('/').filter(Boolean);
    }

    function serializePath(parts) {
        if (parts.length === 0) {
            return '';
        } else {
            return '/' + parts.join('/');
        }
    }

    function parseQuery(query) {
        if (query.startsWith('?')) {
            query = query.substring(1);
        }

        var result = {};
        var parts = query.split('&').filter(Boolean);

        for (var i = 0; i < parts.length; ++i) {
            var kv = parts[i].split('=');
            result[kv[0]] = kv[1];
        }

        return result;
    }

    function serializeQuery(queryObject) {
        var keys = Object.keys(queryObject);
        if (keys.length === 0) {
            return '';
        }

        var parts = [];
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            parts.push([key, queryObject[key]]);
        }

        return '?' + parts.map(function(item) {
            return item.join('=');
        }).join('&');
    }

    function apiUrl() {
        var path = parsePath(window.location.pathname);
        var query = parseQuery(window.location.search);
        var baseUrl = 'https://nhentai.net';
        var newPath = ['api', 'galleries'];
        var newQuery = query;

        if (path.length === 0) {
            newPath.push('all');
        } else if (path.length === 1 && path[0] === 'search') {
            newPath.push('search');
            newQuery.query = newQuery.q;
            delete newQuery.q;
        } else if (path.length === 2) {
            newPath.push('search');
            newQuery.query = path[0] + '%3A' + path[1];
        }

        if (newQuery.page === undefined) {
            newQuery.page = '1';
        }

        return baseUrl + serializePath(newPath) + serializeQuery(newQuery);
    }

    function GET(url, onSuccess, onError) {
        var xhr = new XMLHttpRequest();
        xhr.onload = onSuccess;
        xhr.onerror = onError;
        xhr.open('GET', url);
        xhr.send();
    }

    function isLarge(gallery) {
        return gallery.num_pages > 100;
    }

    function hasTag(gallery, type, name) {
        return gallery.tags.some(function(tag) {
            return tag.type === type && tag.name === name;
        });
    }

    function highlight(gallery, color) {
        var selector = "a[href*='" + gallery.id + "'] .caption";
        var caption = document.querySelector(selector);
        caption.style.backgroundColor = color;
    }

    GET(apiUrl(), function() {
        var galleries = JSON.parse(this.responseText).result;
        var largeGalleries = galleries.filter(isLarge);

        largeGalleries.forEach(function(gallery) {
            if (hasTag(gallery, 'language', 'english')) {
                highlight(gallery, green);
            } else if (hasTag(gallery, 'tag', 'anthology')) {
                // skip
            } else {
                highlight(gallery, red);
            }
        });
    });
})();
