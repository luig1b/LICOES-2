const express = require("express"); 
const https = require("https"); 
const fs = require("fs"); 
const jwt = require("jsonwebtoken"); 
const winston = require("winston"); 
  
const app = express(); 
app.use(express.json()); 
  
const SECRET_KEY = "chaveSecretaDaAula"; 
  
if (!fs.existsSync("logs")) { 
  fs.mkdirSync("logs"); 
} 
  
const logger = winston.createLogger({ 
  level: "info", 
  format: winston.format.combine( 
    winston.format.timestamp(), 
    winston.format.json() 
  ), 
  transports: [ 
    new winston.transports.File({ filename: "logs/usuarios.log" }), 
    new winston.transports.Console() 
  ] 
}); 
  
const usuarios = [ 
  { 
    id: 1, 
    nome: "Administrador", 
    email: "admin@email.com", 
    role: "admin" 
  }, 
  { 
    id: 2, 
    nome: "Cliente Teste", 
    email: "cliente@email.com", 
    role: "cliente" 
  } 
]; 
  
app.use((req, res, next) => { 
  logger.info({ 
    servico: "Usuários Service", 
    metodo: req.method, 
    rota: req.url, 
    ip: req.ip 
  }); 
  
  next(); 
}); 
  
function autenticarToken(req, res, next) { 
  const authHeader = req.headers["authorization"]; 
  
  if (!authHeader) { 
    logger.warn("Acesso negado: token não enviado"); 
  
    return res.status(403).json({ 
      erro: "Token é necessário" 
    }); 
  } 
  
  const token = authHeader.replace("Bearer ", ""); 
  
  jwt.verify(token, SECRET_KEY, (err, usuarioDecodificado) => { 
    if (err) { 
      logger.warn("Token inválido ou expirado"); 
  
      return res.status(401).json({ 
        erro: "Token inválido ou expirado" 
      }); 
    } 
  
    req.usuario = usuarioDecodificado; 
    next(); 
  }); 
} 
  
function autorizarRoles(...rolesPermitidas) { 
  return (req, res, next) => { 
    if (!rolesPermitidas.includes(req.usuario.role)) { 
      logger.warn({ 
        mensagem: "Acesso não autorizado", 
        usuario: req.usuario.nome, 
        role: req.usuario.role 
      }); 
  
      return res.status(403).json({ 
        erro: "Você não tem permissão para acessar este recurso" 
      }); 
    } 
  
    next(); 
  }; 
} 
  
app.get("/", (req, res) => { 
  res.send("Usuários Service rodando com HTTPS"); 
}); 
  
app.get("/usuarios/me", autenticarToken, (req, res) => { 
  res.json({ 
    mensagem: "Dados do usuário autenticado", 
    usuario: req.usuario 
  }); 
}); 
  
app.get( 
  "/usuarios", 
  autenticarToken, 
  autorizarRoles("admin"), 
  (req, res) => { 
    res.json({ 
      mensagem: "Lista de usuários", 
      usuarios 
    }); 
  } 
); 
  
const options = { 
  key: fs.readFileSync("certs/server-key.pem"), 
  cert: fs.readFileSync("certs/server-cert.pem") 
}; 
  
https.createServer(options, app).listen(3001, () => { 
  console.log("Usuários Service rodando em HTTPS na porta 3001"); 
}); 