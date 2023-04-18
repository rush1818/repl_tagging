
const params = new URL(document.location).searchParams;

cms = params.get('cms') || '';

ctfeEnv = params.get('ctfeEnv') || '';
ctfeEnv = ctfeEnv.toLowerCase();

ctfeUrl = ctfeEnv === 'preprod' ? 'https://gtm-ctfe-preprod.corp.google.com' :
                                  'https://www.googletagmanager.com';


containerId = params.get('tagId') || 'G-FJV8CPP1GC';
isGtm = containerId.startsWith('GTM-')


switch (cms) {
  case 'duda':
    addDuda();
    break;
  case 'monsterinsight':
    addMonsterInsights();
    break;
  case 'mi_sitekit':
    addMonsterInsights();
    addSitekit();
    break;
  case 'sitekit':
    addSitekit();
    break;
  case 'squarespace':
    addSquarespace();
    break;

  case 'wix':
    addWix();
    break;

  default:
    break;
}


function addSquarespace() {
  appendToHead(`<foo src="//assets.squarespace.com/"></foo>
<link rel="canonical" href="${location.href}">`);
}

function addSitekit() {
  appendToHead(`<meta name="generator" content="WordPress 1.1.1">
<meta name="generator" content="Site Kit by Google 1.1.1">
`);
}

function addMonsterInsights() {
  appendToHead(`<meta name="generator" content="WordPress 1.1.1">
<script>monsterinsights_</script>`);
}

function addDuda() {
  appendToHead(`<script>window.Parameters.LayoutID = {};</script>`);
}

function addWix() {
  appendToHead(`<meta http-equiv="X-Wix-Meta-Site-Id">
<link rel="canonical" href="${location.href}">`);
}

function appendToHead(content) {
  document.head.innerHTML = document.head.innerHTML + content;
}