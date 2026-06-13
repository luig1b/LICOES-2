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
    new winston.transports.File({ filename: "logs/pedidos.log" }), 
    new winston.transports.Console() 
  ] 
}); 
  
let pedidos = [ 
  { 
    id: 1, 
    usuarioId: 2, 
    produto: "Mouse Gamer", 
    quantidade: 1, 
    status: "Em andamento" 
  } 
]; 
  
app.use((req, res, next) => { 
  logger.info({ 
    servico: "Pedidos Service", 
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
    req.tokenOriginal = authHeader; 
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
  
function consultarUsuarioNoServicoUsuarios(token) { 
  return new Promise((resolve, reject) => { 
    const options = { 
      hostname: "localhost", 
      port: 3001, 
      path: "/usuarios/me", 
      method: "GET", 
      headers: { 
        Authorization: token 
      }, 
      rejectUnauthorized: false 
    }; 
  
    const req = https.request(options, res => { 
      let dados = ""; 
  
      res.on("data", parte => { 
        dados += parte; 
      }); 
  
      res.on("end", () => { 
        try { 
          resolve(JSON.parse(dados)); 
        } catch (erro) { 
          reject(erro); 
        } 
      }); 
    }); 
  
    req.on("error", erro => { 
      reject(erro); 
    }); 
  
    req.end(); 
  }); 
} 
  
app.get("/", (req, res) => { 
  res.send("Pedidos Service rodando com HTTPS"); 
}); 
  
app.post( 
  "/pedidos", 
  autenticarToken, 
  autorizarRoles("cliente", "admin"), 
  (req, res) => { 
    const { produto, quantidade } = req.body; 
  
    const novoPedido = { 
      id: pedidos.length + 1, 
      usuarioId: req.usuario.id, 
      produto, 
      quantidade, 
      status: "Pedido recebido" 
    }; 
  
    pedidos.push(novoPedido); 
  
    logger.info({ 
      mensagem: "Pedido criado", 
      pedido: novoPedido 
    }); 
  
    res.status(201).json({ 
      mensagem: "Pedido criado com sucesso", 
      pedido: novoPedido 
    }); 
  } 
); 
  
app.get( 
  "/pedidos", 
  autenticarToken, 
  autorizarRoles("admin"), 
  (req, res) => { 
    res.json({ 
      mensagem: "Lista completa de pedidos", 
      pedidos 
    }); 
  } 
); 
  
app.get( 
  "/pedidos/me", 
  autenticarToken, 
  autorizarRoles("cliente", "admin"), 
  (req, res) => { 
    const meusPedidos = pedidos.filter( 
      pedido => pedido.usuarioId === req.usuario.id 
    ); 
  
    res.json({ 
      mensagem: "Pedidos do usuário autenticado", 
      pedidos: meusPedidos 
    }); 
  } 
); 
  
app.get("/pedidos/comunicacao-segura", autenticarToken, async (req, res) => { 
  try { 
    const respostaUsuarios = await consultarUsuarioNoServicoUsuarios( 
      req.tokenOriginal 
    ); 
  
    res.json({ 
      mensagem: "Pedidos Service consultou Usuários Service usando HTTPS", 
      respostaUsuarios 
    }); 
  } catch (erro) { 
    logger.error({ 
      mensagem: "Erro na comunicação entre microsserviços", 
      erro: erro.message 
    }); 
  
    res.status(500).json({ 
      erro: "Falha ao comunicar com o serviço de usuários" 
    }); 
  } 
}); 
  
const options = { 
  key: fs.readFileSync("certs/server-key.pem"), 
  cert: fs.readFileSync("certs/server-cert.pem") 
}; 
  
https.createServer(options, app).listen(3002, () => { 
  console.log("Pedidos Service rodando em HTTPS na porta 3002"); 
}); 