(function() {
  // Toggle sidebar en móviles
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (sidebarToggle && sidebar && sidebarOverlay) {
    // Abrir sidebar
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('sidebar--open');
      sidebarOverlay.classList.toggle('active');
    });
    
    // Cerrar sidebar al hacer click en overlay
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('sidebar--open');
      sidebarOverlay.classList.remove('active');
    });
    
    // Cerrar sidebar al hacer click en un link (móviles)
    const sidebarLinks = sidebar.querySelectorAll('.sidebar__link');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('sidebar--open');
          sidebarOverlay.classList.remove('active');
        }
      });
    });
  }
  
  // Marcar link activo basado en la URL actual
  function marcarLinkActivo() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    
    sidebarLinks.forEach(link => {
      link.classList.remove('sidebar__link--activo');
      
      const linkHref = link.getAttribute('href');
      
      // Coincidencia exacta o si la ruta actual comienza con la ruta del link
      if (linkHref && (currentPath === linkHref || 
          (linkHref !== '/' && currentPath.startsWith(linkHref)))) {
        link.classList.add('sidebar__link--activo');
      }
    });
    
    // Si no hay coincidencia exacta, buscar por data-page
    const hasActive = document.querySelector('.sidebar__link--activo');
    if (!hasActive) {
      sidebarLinks.forEach(link => {
        const dataPage = link.getAttribute('data-page');
        if (dataPage && currentPath.includes(dataPage)) {
          link.classList.add('sidebar__link--activo');
        }
      });
    }
  }
  
  // Ejecutar al cargar la página
  marcarLinkActivo();
  
  // Actualizar si la URL cambia (para SPAs)
  window.addEventListener('popstate', marcarLinkActivo);
})();
