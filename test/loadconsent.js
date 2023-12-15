window.adstorage = localStorage.getItem('adstorage') || 'denied';
window.analyticsstorage = localStorage.getItem('analyticsstorage') || 'denied';

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function() {
  window.dataLayer.push(arguments);
}

gtag('consent', 'default', {
  'ad_storage': adstorage,
  'analytics_storage': analyticsstorage,
});

function grantConsent() {
  localStorage.setItem('adstorage', 'granted');
  localStorage.setItem('analyticsstorage', 'granted');
  runUpdate();
}

function denyConsent(){
  localStorage.setItem('adstorage', 'denied');
  localStorage.setItem('analyticsstorage', 'denied');
  runUpdate();
}



function runUpdate(){
  gtag('consent', 'update', {
    'ad_storage': localStorage.getItem('adstorage') ,
    'analytics_storage': localStorage.getItem('analyticsstorage'),
  });
}