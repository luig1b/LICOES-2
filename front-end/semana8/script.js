const botao = document.getElementById("meuBotao");
const mensagem = document.getElementById("mensagem");
 
botao.addEventListener("click", function() {
    mensagem.textContent = "parabéns você comprou o elemento x, so não se acidente!";
    mensagem.style.marginTop = "15px";
    mensagem.style.fontSize = "20px";
    mensagem.style.color = "f0f8ff";
    mensagem.style.fontFamily = 'Arial, Helvetica, sans-serif';
});
 