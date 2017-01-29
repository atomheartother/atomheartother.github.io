---
layout: default
---

<h1>
Tom's Cave
</h1>
<p>This is my professional blog. I put the events I go to and my writeups on here, as well as whatever may fit my fancy.</p>
<p>I hope you enjoy your stay. You can contact me at <a href="mailto:thomasnavennec@gmail.com">thomasnavennec@gmail.com</a></p>
<h1>
Recent Posts:
</h1>

<ul class="post-list">
  {% for post in site.posts %}
      <h2>
        <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title | escape }} - {{ post.date | date: "%b %-d, %Y" }}</a>
      </h2>
      <p>{{ post.desc }}</p>
  {% endfor %}
</ul>