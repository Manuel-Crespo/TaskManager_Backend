"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../utils/auth");
const Token_1 = __importDefault(require("../models/Token"));
const token_1 = require("../utils/token");
const AuthEmail_1 = require("../emails/AuthEmail");
const jwt_1 = require("../utils/jwt");
class AuthController {
    static createAccount = async (req, res) => {
        try {
            const { password, email } = req.body;
            //Prevenir usuarios duplicados
            const userExist = await User_1.default.findOne({ email });
            if (userExist) {
                const error = new Error('El usuario ya esta registrado');
                return res.status(409).json({ error: error.message });
            }
            //Crea un usuario
            const user = new User_1.default(req.body);
            //Hash contraseña
            user.password = await (0, auth_1.hashPassword)(password);
            //Generar el token
            const token = new Token_1.default();
            token.token = (0, token_1.generateToken)();
            token.user = user.id;
            //Enviar el Email
            AuthEmail_1.AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            });
            await Promise.allSettled([user.save(), token.save()]);
            res.send('Cuenta creada, revisa tu correo electrónico para confirmarla');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static confirmAccount = async (req, res) => {
        try {
            const { token } = req.body;
            const tokenExists = await Token_1.default.findOne({ token });
            if (!tokenExists) {
                const error = new Error('Token no válido');
                return res.status(404).json({ error: error.message });
            }
            const user = await User_1.default.findById(tokenExists.user);
            user.confirmed = true;
            await Promise.allSettled([user.save(), tokenExists.deleteOne()]);
            res.send('Cuenta confirmada correctamente');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User_1.default.findOne({ email });
            if (!user) {
                const error = new Error('Usuario no encontrado');
                return res.status(404).json({ error: error.message });
            }
            if (!user.confirmed) {
                const token = new Token_1.default();
                token.user = user.id;
                token.token = (0, token_1.generateToken)();
                await token.save();
                //Enviar el Email
                AuthEmail_1.AuthEmail.sendConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    token: token.token
                });
                const error = new Error('La cuenta no ha sido confirmada, hemos enviado un correo electrónico de confirmación');
                return res.status(401).json({ error: error.message });
            }
            //Revisar contraseña
            const isPasswordCorrect = await (0, auth_1.checkPassword)(password, user.password);
            if (!isPasswordCorrect) {
                const error = new Error('Contraseña incorrecta');
                return res.status(401).json({ error: error.message });
            }
            const token = (0, jwt_1.generateJWT)({ id: user._id });
            res.send(token);
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static requestConfirmationCode = async (req, res) => {
        try {
            const { email } = req.body;
            //Usuario existe
            const user = await User_1.default.findOne({ email });
            if (!user) {
                const error = new Error('El usuario no esta registrado');
                return res.status(404).json({ error: error.message });
            }
            if (user.confirmed) {
                const error = new Error('El usuario ya esta confirmado');
                return res.status(403).json({ error: error.message });
            }
            //Generar el token
            const token = new Token_1.default();
            token.token = (0, token_1.generateToken)();
            token.user = user.id;
            //Enviar el Email
            AuthEmail_1.AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            });
            await Promise.allSettled([user.save(), token.save()]);
            res.send('Se envió un nuevo token a tu correo electrónico');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static forgotPassword = async (req, res) => {
        try {
            const { email } = req.body;
            //Usuario existe
            const user = await User_1.default.findOne({ email });
            if (!user) {
                const error = new Error('El usuario no esta registrado');
                return res.status(404).json({ error: error.message });
            }
            //Generar el token
            const token = new Token_1.default();
            token.token = (0, token_1.generateToken)();
            token.user = user.id;
            await token.save();
            //Enviar el Email
            AuthEmail_1.AuthEmail.sendPasswordResetToken({
                email: user.email,
                name: user.name,
                token: token.token
            });
            res.send('Revisa tu correo electrónico para ver las instrucciones');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static validateToken = async (req, res) => {
        try {
            const { token } = req.body;
            const tokenExists = await Token_1.default.findOne({ token });
            if (!tokenExists) {
                const error = new Error('Token no válido');
                return res.status(404).json({ error: error.message });
            }
            res.send('Token válido, Define tu nueva contraseña');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static updatePasswordWithToken = async (req, res) => {
        try {
            const { token } = req.params;
            const { password } = req.body;
            const tokenExists = await Token_1.default.findOne({ token });
            if (!tokenExists) {
                const error = new Error('Token no válido');
                return res.status(404).json({ error: error.message });
            }
            const user = await User_1.default.findById(tokenExists.user);
            user.password = await (0, auth_1.hashPassword)(password);
            await Promise.allSettled([user.save(), tokenExists.deleteOne()]);
            res.send('La contraseña se modificó correctamente');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static user = async (req, res) => {
        return res.json(req.user);
    };
    static updateProfile = async (req, res) => {
        const { name, email } = req.body;
        const userExist = await User_1.default.findOne({ email });
        if (userExist && userExist.id.toString() !== req.user.id.toString()) {
            const error = new Error('Este correo electrónico ya esta registrado');
            return res.status(409).json({ error: error.message });
        }
        req.user.name = name;
        req.user.email = email;
        try {
            await req.user.save();
            res.send('Perfil actualizado correctamente');
        }
        catch (error) {
            res.status(500).send('Hubo un error');
        }
    };
    static updateCurrentUserPassword = async (req, res) => {
        const { current_password, password } = req.body;
        const user = await User_1.default.findById(req.user.id);
        const isPasswordCorrect = await (0, auth_1.checkPassword)(current_password, user.password);
        if (!isPasswordCorrect) {
            const error = new Error('La contraseña actual es incorrecta');
            return res.status(401).json({ error: error.message });
        }
        try {
            user.password = await (0, auth_1.hashPassword)(password);
            await user.save();
            res.send('La contraseña se modificó correctamente');
        }
        catch (error) {
            res.status(500).send('Hubo un error');
        }
    };
    static checkPassword = async (req, res) => {
        const { password } = req.body;
        const user = await User_1.default.findById(req.user.id);
        const isPasswordCorrect = await (0, auth_1.checkPassword)(password, user.password);
        if (!isPasswordCorrect) {
            const error = new Error('La contraseña es incorrecta');
            return res.status(401).json({ error: error.message });
        }
        res.send('Contraseña correcta');
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map