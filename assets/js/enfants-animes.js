/* Enfants animés : chaque illustration n’apparaît qu’une fois sa planche décodée
   (sinon on verrait un instant la base sans ses parties mobiles), et les
   animations ne tournent que lorsque l’illustration est à l’écran. */
(function () {
  var puppets = document.querySelectorAll('.puppet');

  puppets.forEach(function (puppet) {
    var image = puppet.querySelector('image');
    var src = image && image.getAttribute('href');
    var show = function () { puppet.classList.add('is-ready'); };
    if (!src) return show();
    var sheet = new Image();
    sheet.src = src;
    (sheet.decode ? sheet.decode() : Promise.reject()).then(show, function () {
      sheet.complete ? show() : (sheet.onload = sheet.onerror = show);
    });
  });

  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  });
  puppets.forEach(function (puppet) { observer.observe(puppet); });
})();
