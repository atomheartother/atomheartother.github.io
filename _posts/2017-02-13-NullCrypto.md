---
layout: default
title:  "Nullcon HackIM 2017 - Crypto challenges"
date:   2017-02-13 00:21:42 +0100
categories: cybersecurity
desc: Two nullcon writeups for crypto challenges
---

{% include postheader.md %}

Inn0vHacktion just participated in Nullcon HackIM 2017. We finished 74th out of 363 teams that scored anything, with 1450 total points, and we're pretty happy about it! Here I'll present the writeups to two crypto challenges, #1 and #3... These challenges I felt weren't great example of cryptography challenges. They were more scripting/bruteforcing, in my mind. But alas, that is their category, so what can you do. I helped around with a few other challenges but these two were 100% my own doing, so without further ado, let's get to it!

<h3 id="BBrain">Crypto 1: Breaking Brain</h3>

This challenge, worth 300 points, presents itself under the form of a single image:

![Cryptopuzzle 1]({{site.url}}/assets/NC17_1.png)
<br>*These eggs are making me hungry.*

This is a screenshot taken from [Brainwalletx](https://brainwalletx.github.io/#generator) - a "brainwallet" is the concept of storing Bitcoins in your mind by memorizing a recovery passphrase. This specific page generates an address from said passphrase, along with a private/public key pair. The private key is the challenge's flag, and we get the first and last 3 letters of the passprase. To test that we got the right passphrase, we're also given the resulting address under the form of a QR code. This seems like a problem solveable only through bruteforcing, and indeed, we are given the complete jumbled passphrase at the bottom right of the picture. Once you take away the letters we can see the position of, the letters we have left are: `ucoitsgr`, and it's all about switching them. Should be doable!

I scan the QR with my an app on my phone and it just gives me text: "17iUnGoZbFrGS7uU9z2d2yRT9BKgVqnKnn", the address I'll get from the page once I enter the right passphrase. My first thought was to just use python's `requests` package. I could submit a POST request every single possibile passphrase to the page, and eventually it'd reply to me with the address matching the one I was given! But looking at the target page quick made me a sad man: There are no GET or POST requests on this page, this is entirely done in-browser by the app. Well shit, we'll have to find something else... A quick google search for "python manipulate web page" points to Selenium, a tool I've heard of but never used.

![Selenium Logo]({{site.url}}/assets/selenium1.jpg)

Selenium, as its home page eloquently states, *"automates browsers, that's it!"*. It's a neat tool that lets you start up a browser through code and manipulate it, as if you were actually using it, and it's exactly what I need. [This startup page](http://selenium-python.readthedocs.io/getting-started.html) already pretty much has everything I need to solve this challenge. All I need to do is write a small script that takes every permutation of "ucoitsgr" and types it in the "Passphrase" field along with the prefix and suffix I was given, then test what the resulting address looks like. Let's do that!

{% highlight python %}
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from itertools import permutations
import time

# nullcon8itsgr8

driver = webdriver.Firefox()

driver.get("https://brainwalletx.github.io/#generator")

addr = driver.find_element_by_id("addr")
passp = driver.find_element_by_id("pass")

start = '8ln'
end = 'nl8'
qr = '17iUnGoZbFrGS7uU9z2d2yRT9BKgVqnKnn'

"""
We only need to look for the characters we don't know the position of
"""
for i in permutations('ucoitsgr'):
    print(i)
    pp = start + ''.join(i) + end
    passp.send_keys(pp)

    """
    Need to sleep to let the value update :(
    """
    time.sleep(1)
    rec_addr = addr.get_attribute("value")

    if rec_addr == qr:
        print(pp)
        break
    passp.clear()
{% endhighlight %}

As you can see, it's pretty basic, This challenge would be solved in a few seconds weren't it for the fact that the address takes a solid 1 second to update after I enter the passphrase! So I have to `sleep()` in between each request... Fine, fine, I went for a lunch break while the script ran, the eggs in the challenge pic had made me hungry anyway.

![My script running]({{site.url}}/assets/NC17_2.png)
<br>*This is what it looks like, the pass field gets filled up automatically every second, just as if I had typed it.*

And when I came back... The passphrase was done! I honestly forgot what the passphrase was, but the resulting private key was `5KjzfnM4afWU8fJeUgGnxKbtG5FHtr6Suc41juGMUmQKC7WYzEG`, and that's the flag!