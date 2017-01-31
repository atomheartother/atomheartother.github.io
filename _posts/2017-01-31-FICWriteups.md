---
layout: default
title:  "FIC 2017 - Three short writeups"
date:   2017-01-31 19:38:42 +0100
categories: cybersecurity
desc: Various writeups for FIC 2017: One in phishing, one in steganography and another in forensics.
---

{% include postheader.md %}

We went to FIC 2017 and participated in both challenges held there. More information [here]({% post_url 2017-01-26-FIC2017 %})! These are three short writeups on simple challenges we did there. I had to do a presentation to first-year students on how we approach challenges, so I thought basic challenges were a good place to start, and a good excuse to write a blog post down too!

<h3>EPITA Challenge: Tout Un Mobile</h3>

Someone at weakcorp got their bank information stolen. The theft happen through the victim' Android phone. We are given part of its files and the simple duty to figure out the date at which the attack occurred.

We're given a .zip file containing media files from the SD Card and app data. There could be something in Downloads, but nothing seems obviously bad, so first we should check out the applications' databases. Android apps generally use SQLite, so we'll use the excellent [SQLite Browser](http://sqlitebrowser.org/). Let's check out their browsing history!

![Mobile 1]({{site.url}}/assets/FicChall1.png)
<br>*Just another day at the NSA.*

We can see they visited a site called FICBank a bunch of times. There's dates, but there is no reason to think the attack happened through browser. It could have, but let's dig deeper. After poking around the phone, we find the phone app at '`com.android.providers.telephony`', and it has an mms/sms database! Let's check it out. The mms/sms app has about 3000 messages, but we're only interested in messages that are about "FICBank". We input that in the SMS content filter and... bingo!

![Mobile 2]({{site.url}}/assets/FicChall2.png)
<br>*Bingo Bango!*

Obviously, the bank includes an url to its website in every text message, making our lives easier. Looking through the messages, it looks like FICBank sent the victim a notification saying there was a withdrawal of 25 000 euros on their account (Which only held 2 500 euros). This is most likely the exact date of the attack: 1481673263000. Even without being familiar with Android app data, this clearly looks like Epoch time. We go on an online converter and convert it to local time... And get the flag: `14/12/2016`.

<h3>ACISSI Challenge: Steganography</h3>

This challenge is basic Steganography. We're given an image:

![Tux]({{site.url}}/assets/Tux1.png)
<br>*Isn't he cute?*

After opening it in an image viewer and looking around, we can clearly see pixels that don't belong there: A line of blue pixels where there should be black. Colors are encoded as RGB (Red, Green, Blue), so the fact that these look like pure blue pixels  means that their RGB values look like: `0000XX`. There could be data in there! Let's open the file in GIMP and look at the pixels.

![Blue pixels]({{site.url}}/assets/Tux2.png)
<br>*I recommend looking at your friends' Facebook pictures at this zoom level, too.*

The first blue pixel has an RGB value of `000057`, which is "W" in ASCII. Looks like the flag is right here! Decoding the rest of the pixels gives us the string: `WEWINFIC2K17`.

<h3>ACISSI Challenge: Kitten's Playground</h3>

This was a basic Forensics challenge. People have been getting weird mails containing cat pictures and we have to analyze it. The file we receive is a tar.gz archive: `kittensplayground.tar.gz`.

![Kitties!]({{site.url}}/assets/kitten1.png)
<br>Kitties!

We extract the archive and... gzip exits afte detecting "trailing garbage" in the file. Looks like there's another file hidden after the compressed data. `binwalk` is the perfect utility for this, as it goes through a file and sees if there are any other files within it. We run `binwalk -e` on the file and get three files. We could care about the others, but one of them is called `flag`.

![Not kitties :c]({{site.url}}/assets/kitten2.png)
<br>I would have preferred cat pictures...

We open it, and get what looks like hex ASCII values. After decoding them, we get `P@i||p3rZ@r3Fun!`, which is the flag. And here's a bonus cat picture from the extracted images:

![An actual kitty!]({{site.url}}/assets/kitten3.jpe)
<br>*Thanks for reading!*
