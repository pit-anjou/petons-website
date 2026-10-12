/* Enfants animés : chaque illustration n’apparaît qu’une fois sa planche décodée
   (sinon on verrait un instant la base sans ses parties mobiles), et les
   animations ne tournent que lorsque l’illustration est à l’écran.
   Une planche écrite en data-href (au lieu de href) n’est téléchargée qu’à
   l’approche de l’illustration : elle ne ralentit plus l’ouverture de la page. */
(function () {
  var puppets = document.querySelectorAll('.puppet');

  var reveal = function (puppet) {
    puppet.querySelectorAll('image[data-href]').forEach(function (image) {
      image.setAttribute('href', image.getAttribute('data-href'));
      image.removeAttribute('data-href');
    });
    var image = puppet.querySelector('image');
    var src = image && image.getAttribute('href');
    var show = function () { puppet.classList.add('is-ready'); };
    if (!src) return show();
    var sheet = new Image();
    sheet.src = src;
    (sheet.decode ? sheet.decode() : Promise.reject()).then(show, function () {
      sheet.complete ? show() : (sheet.onload = sheet.onerror = show);
    });
  };

  var lazy = [];
  puppets.forEach(function (puppet) {
    if (puppet.querySelector('image[data-href]') && 'IntersectionObserver' in window) {
      puppet.classList.add('is-lazy');
      lazy.push(puppet);
    } else {
      reveal(puppet);
    }
  });

  if (!('IntersectionObserver' in window)) return;
  var loader = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      loader.unobserve(entry.target);
      reveal(entry.target);
    });
  }, { rootMargin: '600px 0px' });
  lazy.forEach(function (puppet) { loader.observe(puppet); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  });
  puppets.forEach(function (puppet) { observer.observe(puppet); });
})();
