if ('serviceWorker' in navigator) { 

    navigator.serviceWorker.register('./service-worker.js') 
  
      .then(() => console.log('Service Worker registrado.')) 
  
      .catch(error => console.log('Erro ao registrar SW:', error)); 
  
  } 
  
   
  
  const botao = document.getElementById('btnNotificar'); 
  
   
  
  botao.addEventListener('click', async () => { 
  
    if (!('Notification' in window)) { 
  
      alert('Este navegador nao suporta notificacoes.'); 
  
      return; 
  
    } 
  
   
  
    const permissao = await Notification.requestPermission(); 
  
   
  
    if (permissao === 'granted') { 
  
      new Notification('PWA funcionando!', { 
  
        body: 'Esta e uma notificacao local de teste.' 
  
      }); 
  
    } else { 
  
      alert('Permissao de notificacao negada.'); 
  
    } 
  
  }); 
  
   