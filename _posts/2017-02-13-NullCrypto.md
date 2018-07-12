---
layout: post
title:  "Nullcon HackIM 2017 - Crypto challenges"
last_modified_at:   2017-02-13 00:21:42 +0100
categories: 
- Cybersecurity
---

Inn0vHacktion just participated in Nullcon HackIM 2017. We finished 74th out of 363 teams that scored anything, with 1450 total points, and we're pretty happy about it! Here I'll present the writeups to two crypto challenges, #1 and #3... These challenges I felt weren't great example of cryptography challenges. They were more scripting/bruteforcing, in my mind. But alas, that is their category, so what can you do. I helped around with a few other challenges but these two were 100% my own doing, so without further ado, let's get to it!

<h3 id="BBrain">Crypto 1: Breaking Brain</h3>

This challenge, worth 300 points, presents itself under the form of a single image:

![Cryptopuzzle 1]({{site.url}}/assets/NC17_1.png)
<br>*These eggs are making me hungry.*

This is a screenshot taken from [Brainwalletx](https://brainwalletx.github.io/#generator) - a "brainwallet" is the concept of storing Bitcoins in your mind by memorizing a recovery passphrase. This specific page generates an address from said passphrase, along with a private/public key pair. The private key is the challenge's flag, and we get the first and last 3 letters of the passprase. To test that we got the right passphrase, we're also given the resulting address under the form of a QR code. This seems like a problem solveable only through bruteforcing, and indeed, we are given the complete jumbled passphrase at the bottom right of the picture. Once you take away the letters we can see the position of, the letters we have left are: `ucoitsgr`, and it's all about switching them. Should be doable!

I scan the QR with my  phone and it just gives me text: "17iUnGoZbFrGS7uU9z2d2yRT9BKgVqnKnn", the address I'll get from the page once I enter the right passphrase. My first thought was to just use python's `requests` package. I could submit a POST request for every single possibile passphrase to the page, and eventually it'd reply to me with the address matching the one I was given! But looking at the target page quickly made me a sad man: There are no GET or POST requests on this page, this is entirely done in-browser by the client. Well shit, we'll have to find something else... A quick google search for "python manipulate web page" points to Selenium, a tool I've heard of but never used.

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

<h3 id="NStep">Crypto 3: Next Step</h3>

This challenge consists of an encrypted file, `message.new`, and a private key, `HackIM.key`. We were also given a picture: the cover of the Digits magazine for June 2016, with a few modifications. The challenge wwas worth 200 points. I'll go in detail about openssl and private keys, because overall otherwise the challenge was fairly short and easy.

![Digit cover]({{site.url}}/assets/DigitCover.png)
<br>*This feels very 90's to me for some reason.*

Public/private key pairs, commonly called public key cryptography, are a solution to a simple problem: how do I send a message to someone over a potentially insecure connection, without being able to agree on a passphrase beforehand? If it requires a key of some sort (a 'key' being any data that you can use to encrypt or decrypt the message, such as a string of characters), I could just send the key over to you, then encrypt my message with it, but anyone who has intercepted the key could also decrypt the message.

Public key cryptography solves this problem with assymetric encryption. Let's say Alice wants people to be able to send messages to her securely. She generates two keys: A private and public key. The public key is used to encode the data, and then **only** the private key can decode it. Alice puts her public key out in the open for all to see, and keeps her private key secret. Now anyone can encrypt a message meant for alice with her public key and send it over an insecure connection. Even if it is intercepted, the attacker won't have access to the private key, they therefore cannot decrypt the data!

![RSA keypair](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Public_key_encryption.svg/250px-Public_key_encryption.svg.png)
<br>*Bob and Alice are very secretive about saying hello.*

Key pairs are an important part of the SSL protocol, which is dedicated to providing secure connections between peers. To add another layer of security, private keys can be protected by a password, so that even if an user's private key fell in the wrong hands (like the private key we received for this challenge), no one could use it without the password. An usual way of manipulating key pairs is using `openssl`, an open source toolkit that implements SSL.

So with all that in mind, let's try and decrypt the message we got with openssl!

![Opening it]({{site.url}}/assets/openssl.png)
<br>*I really need a green-on-black theme to be a true hacker.*

Oh no, it's password protected! :c I should mention in a regular attack this could be a bit of a headache, even bruteforcing the password would take me a while. Luckily, the Digit cover that I showed above says that the password to decrypt `HackIM.key` is "1 + 5 digits". That can be understood as "1, then 5 digits", so 1xxxxx or as just 6 digits, and since I don't really trust whoever wrote it, I'll be safe and go for 6 digits.

Ok so we know the password is 6 digits. Looking up a way to test RSA private key passwords in code yields [this Sackoverflow thread](http://stackoverflow.com/questions/41766417/verify-the-passphrase-for-rsa-private-key) which has the exact code I need - my script is actually pretty much a copy of the top reply. Let's code our bruteforcer! We just need to try every possible 6 digit number.

{% highlight python %}
import paramiko
import itertools
from paramiko import rsakey

kf = open("HackIM.key", "r")

dlist = itertools.product(['1', '2', '3', '4','5', '6',
                           '7', '8', '9', '0'], repeat=6)

for d in dlist:
    s = ''.join(d)

    kf.seek(0)
    try:
        nk = rsakey.RSAKey.from_private_key(kf, password=s)
        print("success: " + s)
        break
    except paramiko.ssh_exception.SSHException:
        print("fail: " + s)
{% endhighlight %}

We run it and it cracks the key in a few seconds - and it turns out the passphrase did have a '1' as its first digit! It's `141525`. We can now decrypt the message:

![Opening it]({{site.url}}/assets/openssl2.png)
<br>*Well, this isn't what I expected.*

Alright, so we have to go to page `141525` of the magazine (I actually tried it with 41525 at first because remember, the cover says it's 1 + a 5 digit password, so the 1 isn't part of the password, but it didn't work), I found the digit magazine [here](https://www.pdf-archive.com/2016/06/04/digit-june-2016/digit-june-2016.pdf)... But the pdf only has 124 pages. That's fine, we can just do a modulus, and it'll be as if we kept counting pages until we reached 141525:

`141525 % 124 = 41`

We go to page 41 and manually try the md5 hash of all of these brands... ans clearTax turns out to be it!

{% highlight bash %}
TomArch% echo -ne "clearTax" | md5sum 
8c437d9ef6c7786e9df3ac2bf223445e  -
{% endhighlight %}

And that's it, `clearTax` was the flag! Overall I'd say, CTF makers, please, skip stuff like the magazine search. It actually was a bit of a pain, between the two interpretations of what the password is, the different possible ways to interpret what "page 141525" is, and having to manually enter brand names for hashes, the flag might as well just have been in that text file. But it was still a fun little bruteforcing I suppose.

Thanks for reading, I hope you enjoyed my two little writeups!

**Edit:** I have since read some other writeup and it turns out that when you open the magazine in a certain website, the correct logo is on pages "14-15/25", which spells out 141525. If this is how it was meant to be solved, it's very convoluted and I was pretty lucky I got this flag with my modulus...