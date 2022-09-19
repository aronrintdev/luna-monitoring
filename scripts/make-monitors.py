import requests
TOKEN = 'pak.CVn1IwpFEUyFvF~1lqg7cd86uujKcOrgcj.s'


HOST = 'http://localhost:8080'

topUrls = ["facebook.com/",
           "twitter.com/",
           "google.com/",
           "youtube.com/",
           "instagram.com/",
           "linkedin.com/",
           "wordpress.org/",
           "pinterest.com/",
           "wikipedia.org/",
           "wordpress.com/",
           "blogspot.com/",
           "apple.com/",
           "adobe.com/",
           "tumblr.com/",
           "youtu.be/",
           "amazon.com/",
           "goo.gl/",
           "vimeo.com/",
           "flickr.com/",
           "microsoft.com/",
           "yahoo.com/",
           "godaddy.com/",
           "qq.com/",
           "bit.ly/",
           "vk.com/",
           "reddit.com/",
           "w3.org/",
           "baidu.com/",
           "nytimes.com/",
           "t.co/",
           "europa.eu/",
           "buydomains.com/",
           "wp.com/",
           "statcounter.com/",
           "miitbeian.gov.cn/",
           "jimdo.com/",
           "blogger.com/",
           "github.com/",
           "weebly.com/",
           "soundcloud.com/",
           "mozilla.org/",
           "bbc.co.uk/",
           "yandex.ru/",
           "myspace.com/",
           "google.de/",
           "addthis.com/",
           "nih.gov/",
           "theguardian.com/",
           "google.co.jp/",
           "cnn.com/",
           "stumbleupon.com/",
           "gravatar.com/",
           "digg.com/",
           "addtoany.com/",
           "creativecommons.org/",
           "paypal.com/",
           "yelp.com/",
           "imdb.com/",
           "huffingtonpost.com/",
           "feedburner.com/",
           "issuu.com/",
           "wixsite.com/",
           "wix.com/",
           "dropbox.com/",
           "forbes.com/",
           "miibeian.gov.cn/",
           "amazonaws.com/",
           "google.co.uk/",
           "washingtonpost.com/",
           "bluehost.com/",
           "etsy.com/",
           "go.com/",
           "msn.com/",
           "wsj.com/",
           "ameblo.jp/",
           "archive.org/",
           "slideshare.net/",
           "e-recht24.de/",
           "weibo.com/",
           "fc2.com/",
           "eventbrite.com/",
           "parallels.com/",
           "doubleclick.net/",
           "mail.ru/",
           "sourceforge.net/",
           "amazon.co.uk/",
           "telegraph.co.uk/",
           "ebay.com/",
           "amzn.to/",
           "livejournal.com/",
           "51.la/",
           "free.fr/",
           "yahoo.co.jp/",
           "dailymail.co.uk/",
           "reuters.com/",
           "taobao.com/",
           "wikimedia.org/",
           "amazon.de/",
           "typepad.com/",
           "hatena.ne.jp/",
           "bloomberg.com/",
           "elegantthemes.com/",
           "eepurl.com/",
           "usatoday.com/",
           "about.com/",
           "medium.com/",
           "macromedia.com/",
           "xing.com/",
           "bing.com/",
           "time.com/",
           "www.gov.uk/",
           "google.it/",
           "cdc.gov/",
           "tripadvisor.com/",
           "cpanel.net/",
           "amazon.co.jp/",
           "npr.org/",
           "harvard.edu/",
           "bbb.org/",
           "aol.com/",
           "constantcontact.com/",
           "latimes.com/",
           "icio.us/",
           "list-manage.com/",
           "webs.com/",
           "opera.com/",
           "beian.gov.cn/",
           "vkontakte.ru/",
           "blogspot.co.uk/",
           "live.com/",
           "bandcamp.com/",
           "apache.org/",
           "bbc.com/",
           "businessinsider.com/",
           "dailymotion.com/",
           "cpanel.com/",
           "disqus.com/",
           "behance.net/",
           "mit.edu/",
           "rambler.ru/",
           "gnu.org/",
           "sina.com.cn/",
           "spotify.com/",
           "joomla.org/",
           "google.es/",
           "line.me/",
           "wired.com/",
           "github.io/",
           "stanford.edu/"
           ]

#url = HOST + '/api/monitors?offset=0&limit=10'
endpoint = HOST + '/api/monitors'
headers = {'Content-Type': 'application/json',
           'Authorization': 'Bearer {}'.format(TOKEN),
           'x-proautoma-accountid': 'e3eb5f72-f346-48d8-bf6c-7dc47294d096'}


for url in topUrls:
    x = requests.put(endpoint, headers=headers, json={
        'method': 'GET',
        'name': url,
        'url': 'https://www.'+url,
        'frequency': '60',
        'locations': ['us-east1']
    })

    print(x)
    print(x.text)