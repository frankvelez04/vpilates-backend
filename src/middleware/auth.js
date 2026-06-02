const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Falta el token de autenticación" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Token inválido" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.cliente_id = decoded.id; 
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token no válido o expirado" });
    }
};
