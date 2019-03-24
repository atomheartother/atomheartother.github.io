---
layout: post
title: "Securinet 2019 Prequalz - Trading Value"
categories:
  - Cybersecurity
last_modified_at: 2019-03-24 18:08:00 +0000
comments: true
---

Trading value was a pretty simple challenge, though we're not sure our solution is the right one ;)

# The Challenge

Trading Value consisted of a page with a graph that seemed to display random values. Looking at the page source we find that the page is sending a request to the server every so often asking for the next value to display (file truncated):

```js
{
  chart: {
    type: "spline",
    animation: Highcharts.svg, // don't animate in old IE
    marginRight: 10,
    events: {
      load: function() {
        // set up the updating of the chart each second
        var series = this.series[0];
        var formula =
          "KHYxLm1wayt2MS5kcmYqKHYxLm1way8wLjUpLXYxLmRyZikvKHYxLmF2ZyowLjEpKyh2Mi5hdmcqKHYyLm1kcyt2Mi5kbXEpKS0odjMucGRpK3YzLnBkaSszLzIqKHYzLnJhciktdjMuZ2RwKSswLjI1Kih2NC5tdW0qdjQuZGFkKSp2NC5hdmc=";
        setInterval(function() {
          $.get("/default", {
            formula: formula,
            values: { v1: "STC", v2: "PLA", v3: "SDF", v4: "OCK" }
          }).done(function(data) {
            var x = new Date().getTime(), // current time
              y = parseInt(data);
            if (y < 1000)
              formula =
                "KHYxLm1wayt2MS5kcmYqKHYxLm1way8wLjUpLXYxLmRyZikvKHYxLmF2ZyowLjEpKyh2Mi5hdmcqKHYyLm1kcyt2Mi5kbXEpKS0odjMucGRpK3YzLnBkaSszLzIqKHYzLnJhciktdjMuZ2RwKSswLjI1Kih2NC5tdW0qdjQuZGFkKSp2NC5hdmc=";
            else if (y > 1000 && y < 10000)
              formula =
                "KHYxLm1way12MS5kcmYqKHYxLm1way8xMDApLXYxLmRyZikvKHYxLmF2ZyowLjMpLSh2Mi5hdmcvKCg0LzMpKnYyLm1kcyt2Mi5kbXEqMTAwKSkrKHYzLnBkaSt2My5wZGkrMy8yKig1KnYzLnJhciktNjkqdjMuZ2RwKSsxLjcqKHY0Lm11bSp2NC5kYWQpKjE2LjUqdjQuYXZn";
            else if (y > 10000 && y < 100000)
              formula =
                "KHYxLm1way12MS5kcmYqKHYxLm1way8wLjEpLXYxLmRyZikvKHYxLmF2ZyowLjgpLSh2Mi5hdmcvKCgxLzIpKnYyLm1kcy0yNC92Mi5kbXEqMTApKSsodjMucGRpLXYzLnBkaSszLzIqKDIvNSp2My5yYXIpLTY2KnYzLmdkcCkqNy41Lyh2NC5tdW0vdjQuZGFkKSo2LjUvdjQuYXZn";
            else
              formula =
                "KHYxLm1way12MS5kcmYqKHYxLm1way8wLjA2KS12MS5kcmYpLyh2MS5hdmcqMC4yNSkrKHYyLmF2Zy8oKDMvMikvdjIubWRzLTg0L3YyLmRtcSoxOSkpLSh2My5wZGktdjMucGRpKzkvMiooMTIvNyp2My5yYXIpLTY2KnYzLmdkcCkqMC41Lyh2NC5tdW0qKnY0LmRhZCkqMC4zOS92NC5hdmcqKjI=";
            series.addPoint([x, y], true, true);
          });
        }, 1000);
      }
    }
  }
}
```

The base64 payloads appear to be some sort of math formulae, for example:
`(v1.mpk+v1.drf*(v1.mpk/0.5)-v1.drf)/(v1.avg*0.1)+(v2.avg*(v2.mds+v2.dmq))-(v3.pdi+v3.pdi+3/2*(v3.rar)-v3.gdp)+0.25*(v4.mum*v4.dad)*v4.avg`

So:

- v1, v2, v3 and v4 are sent to the server with the NAME of the object they refer to
- The client also chooses which formula the server uses on them

So first of all what happens if we encode `v4` in base64 and send that? The server responds

```
object(App\Entity\OCK)#253 (4) {
  ["id":"App\Entity\OCK":private]=>
  NULL
  ["avg"]=>
  int(267)
  ["mum"]=>
  int(21)
  ["dad"]=>
  int(80)
}
```

So `vX` values refer to _actual variables_ in php (a Symfony server). We try to run some shell_exec commands but nothing works, and the errors tell us that the values we send are being inputted into a `new Expression("...")` formula. I didn't know much about Symfony or Expression so I poked around but couldn't find much. I figured i could print any variable in the current scope with values I put in `v1`. I tried `flag` and other values but nothing worked...

Just for fun I decided to set `v1` to `this`. Burp responded with "This message is too large to display". Woooow, ok, time for CURL:

`curl 'https://web1.ctfsecurinets.com/default?formula=djE%3d&values%5Bv1%5D=this' | grep 'Securinets{`

Gives:
`string(47) "Securinets{T00_Ea5y_T0_U5e_This_Local_variable}"`

And that's it! We were the first team to flag this ;)
