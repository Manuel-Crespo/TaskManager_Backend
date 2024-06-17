import { transporter } from "../config/nodemailer"

interface IEmail {
    email: string
    name: string
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user : IEmail) => {
        const info = await transporter.sendMail({
            from: 'TaskManager <admin@taskmanager.com>',
            to: user.email,
            subject: 'TaskManager - Confirma tu cuenta',
            text: 'TaskManager - Confirma tu cuenta',
            html: `<p>Hola: ${user.name}, has creado tu cuenta en TaskManager, ya casi esta
            todo listo, solo debes confirmar tu cuenta</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar cuenta</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        })

        console.log('Mensaje enviado', info.messageId)
    }

    static sendPasswordResetToken = async (user : IEmail) => {
        const info = await transporter.sendMail({
            from: 'TaskManager <admin@taskmanager.com>',
            to: user.email,
            subject: 'TaskManager - Restablece tu contraseña',
            text: 'TaskManager - Restablece tu contraseña',
            html: `<p>Hola: ${user.name}, has solicitado cambiar tu contraseña.</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Restablecer Contraseña</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        })

        console.log('Mensaje enviado', info.messageId)
    }
}