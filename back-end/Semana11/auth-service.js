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
    new winston.transports.File({ filename: "logs/auth.log" }), 
    new winston.transports.Console() 
  ] 
}); 
  
const usuarios = [ 
  { 
    id: 1, 
    nome: "Administrador", 
    email: "admin@email.com", 
    senha: "123", 
    role: "admin" 
  }, 
  { 
    id: 2, 
    nome: "Cliente Teste", 
    email: "cliente@email.com", 
    senha: "123", 
    role: "cliente" 
  } 
]; 
  
app.use((req, res, next) => { 
  logger.info({ 
    servico: "Auth Service", 
    metodo: req.method, 
    rota: req.url, 
    ip: req.ip 
  }); 
  
  next(); 
}); 
  
app.get("/", (req, res) => { 
  res.send("Auth Service rodando com HTTPS"); 
}); 
  
app.post("/login", (req, res) => { 
  const { email, senha } = req.body; 
  
  const usuario = usuarios.find( 
    u => u.email === email && u.senha === senha 
  ); 
  
  if (!usuario) { 
    logger.warn({ 
      mensagem: "Tentativa de login inválida", 
      email 
    }); 
  
    return res.status(401).json({ 
      erro: "E-mail ou senha inválidos" 
    }); 
  } 
  
  const token = jwt.sign( 
    { 
      id: usuario.id, 
      nome: usuario.nome, 
      role: usuario.role 
    }, 
    SECRET_KEY, 
    { 
      expiresIn: "1h" 
    } 
  ); 
  
  logger.info({ 
    mensagem: "Login realizado com sucesso", 
    usuario: usuario.email, 
    role: usuario.role 
  }); 
  
  res.json({ 
    mensagem: "Login realizado com sucesso", 
    token, 
    role: usuario.role 
  }); 
}); 
  
const options = { 
  key: fs.readFileSync("certs/server-key.pem"), 
  cert: fs.readFileSync("certs/server-cert.pem") 
}; 
  
https.createServer(options, app).listen(3000, () => { 
  console.log("Auth Service rodando em HTTPS na porta 3000"); 
});