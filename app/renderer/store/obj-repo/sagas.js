/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, take, call } from 'redux-saga/effects';

/* Helpers */
import { putAndTake } from '../../helpers/saga';
import { convertToObjectTree, getRepositoryNameFromFileName } from '../../helpers/objrepo';
import { success, failure, successOrFailure } from '../../helpers/redux';
import orgRequire from '../../helpers/require';
import { notification } from 'antd';

/* Types */
import ActionTypes from '../types';

/* Action Creators */
import * as fsActions from '../fs/actions';
import * as repoActions from './actions';
import * as settingsActions from '../settings/actions';

/* Services */
import ServicesSingleton from '../../services';
const services = ServicesSingleton();

/**
 * Object Repository Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.OR_OPEN_FILE, openFile),
      takeLatest(ActionTypes.OR_OBJECT_REPOSITORY_FILE, clearObjectRepositoryFile)
    ]);
}

export function* clearObjectRepositoryFile() {
    yield put(repoActions.clearObjRepo());
    yield put(settingsActions.setSidebarComponent('right', null));
    yield put(settingsActions.setSidebarVisible('right', false));
}

export function* openFile({ payload }) {
    const { path, force, repoRootCopy } = payload;
    if (!path) {
        return;
    }

    const currentRepoPath = yield select(state => state.objrepo.path);

    if(force){
        // info from file watcher that file changed
    } else {
        // check if the repo we are trying to open is the same as the one currently open
        if (path === currentRepoPath) {
            return;     // ignore open file call 
        }    
    }
    // get file info from the cache
    let file = yield select(state => state.fs.files[path]);
    if (!file) {
        return;
    }
    else if (file.ext !== '.js' && file.ext !== '.json') {
        yield put(repoActions._openFile_Failure(path, { message: 'Unsupported file extension.' }));
        return;
    }
    let repoRoot;
    let start;
    let end;
    // if this is a .js file, then use 'require' to parse the file
    if (file.ext === '.js') {
        try {
            if(force && repoRootCopy){
                repoRoot = repoRootCopy;
            } else {
                repoRoot = orgRequire(file.path);
                if(Object.keys(repoRoot).length === 0){
                    notification['error']({
                        message: 'Not valid repo file:'+file.path,
                        description: 'module.exports = po; is required',
                    });
                }
            }
            const content = yield getFileContent(path);
            start = content.split('{')[0];
            const endArray = content.split('}');
            end = endArray[endArray.length-1];
        }
        catch (e) {
            yield put(repoActions._openFile_Failure(path, e));
            return;
        }
    }
    // else, retrieve json file's content
    else {
        try {
            const content = yield getFileContent(path);
            repoRoot = JSON.parse(content);
        }
        catch (e) {
            console.error(e);
            yield put(repoActions._openFile_Failure(path, e));
            return;
        }    
    }
    // retrieve file name without extension
    const name = getRepositoryNameFromFileName(file.name);
    // convert original object repository structure to tree based structure
    const treeRoot = convertToObjectTree(repoRoot);
    // report success
    yield put(repoActions._openFile_Success(path, name, treeRoot, start, end, repoRoot));
}

function* getFileContent(path) {
    if (!path) {
        return null;
    }
    /*
    // check if file content has been previously retrieved
    const fileCache = yield select(state => state.fs.files);


    const file = fileCache[path];
    if (file && file.hasOwnProperty('content') && file.content != null) {
        return file.content;
    }
    */
    // if file is not cached, let's fetch its content and add it to the editor
    const { response, error } = yield putAndTake(
        fsActions.fetchFileContent(path)
    );
    if (error) {
        throw new Error(error.message || null);
    }
    return response;
}