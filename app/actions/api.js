
import { auth, base} from '../firebase'
import {saveUserLocal} from './coreActions'
import * as types from './actionTypes'

export const createUser = (data) => ({
    firebase: 'auth',
    type: types.REGISTER_USER,
    data,
})

export const updatePassword = (password) => ({
    firebase: 'auth',
    type: types.UPDATE_USER_PASSWORD,
    data: {password},
})
export const updateUserProfile = (data) => ({
    firebase: 'auth',
    type: types.UPDATE_USER_PROFILE,
    data,
})
export const loginUser = (data) => ({
    firebase: 'auth',
    type: types.LOGIN_USER,
    data
})

export const forgotPassword = (email) => ({
    firebase: 'auth',
    type: types.FORGOT_PASSWORD,
    data: {email}
})

export const logoutUser = () => ({
    firebase: 'auth',
    type: types.LOGOUT_USER,
    data: {}
})