import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export function validateEmail(e: string) {

    let emailRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (e.length > 5 && emailRegEx.test(e.toLowerCase())) { 
        return {
            message: 'Valid E-mail'
        }; 
    }

    return null;
}

export function validateRegister(options: UsernamePasswordInput) {

    if(options.username.length < 2) {
        return [
            {
                field: 'username',
                message: 'Username must be at least 2 charachters.'
            }
        ]
    }
 
    if (!validateEmail(options.email)) {
        return [
            {
                field: 'email',
                message: 'Invalid E-mail.'
            }
        ]
    }

    if(options.password.length < 3) {
        return [
            {
                field: 'password',
                message: 'password must be at least 3 charachters.'
            }
        ]
    }

    return null;
}