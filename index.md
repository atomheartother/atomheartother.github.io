---
layout: default
---

<h1>
Tom's Cave
</h1>
<p>This is my professional blog. I put the events I go to and my writeups on here, as well as whatever may fit my fancy. I also make music and might post some of that here.</p>
<p>Most of the CTFs I participate in, I do so with my team, InnovHacktion. We're a team of passionated Computer Science students from Epitech, Paris. I hope you enjoy your stay.</p>
<h1>
Blog Posts:
</h1>

<ul class="post-list">
  {% for post in site.posts %}
      <h3>
        <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title | escape }} - {{ post.date | date: "%b %-d, %Y" }}</a>
      </h3>
      <p>{{ post.desc }}</p>
  {% endfor %}
</ul>