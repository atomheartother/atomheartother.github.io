---
layout: default
title:  "FIC 2017 Writeups"
date:   2017-01-26 23:12:56 +0100
categories: cybersecurity
desc: Various writeups for FIC 2017
---

{% include postheader.md %}

<h1>EPITA Challenge: Tout Un Mobile</h1>

Someone at weakcorp got their bank information stolen. The theft happen through the victim' Android phone. We are given part of its files and the simple duty to figure out the date at which the attack occurred.

We're given a .zip file containing media files from the SD Card and app data. There could be something in Downloads, but nothing seems obviously bad, so first we should check out the applications' databases. Android apps generally use SQLite, so we'll use the excellent [SQLite Browser](http://sqlitebrowser.org/). Let's check out their browsing history!

![Mobile 1]({{site.url}}/assets/FicChall1.png)
<br>*Just another day at the NSA.*

We can see they visited a site called FICBank a bunch of times. There's dates, but there is no reason to think the attack happened through browser. It could have, but let's dig deeper. After poking around the phone, we find the phone app at '`com.android.providers.telephony`', and it has an mms/sms database! Let's check it out. The mms/sms app has about 3000 messages, but we're only interested in messages that are about "FICBank". We input that in the SMS content filter and... bingo!

![Mobile 2]({{site.url}}/assets/FicChall2.png)
<br>*Bingo Bango!*

Obviously, the bank includes an url to its website in every text message, making our lives easier. Looking through the messages, it looks like FICBank sent the victim a notification saying there was a withdrawal of 25 000 euros on their account (Which only held 2 500 euros). This is most likely the exact date of the attack: 1481673263000. Even without being familiar with Android app data, this clearly looks like Epoch time. We go on an online converter and convert it to local time... And get the flag: `14/12/2016`.

<h1>ACISSI Challenge: #3</h1>

This challenge is very basic Steganography. We're given an image:

![Tux]({{site.url}}/assets/Tux1.png)
<br>*Isn't he cute?*

After opening it in an image viewer and looking around, we can clearly see pixels that don't belong there: A line of blue pixels where there should be black. Colors are encoded as RGB (Red, Green, Blue), so the fact that these look like pure blue pixels  means that their RGB values look like: `0000XX`. There could be data in there! Let's open the file in GIMP and look at the pixels.

![Blue dots]({{site.url}}/assets/Tux2.png)
<br>*I recommend looking at your friends' Facebook pictures at this zoom level, too.*

The first blue pixel has an RGB value of `000057`, which is "W" in ASCII. Looks like the flag is right here! Decoding the rest of the pixels gives us the string: `WEWINFIC2K17`.