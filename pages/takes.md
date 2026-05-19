---
layout: Post
permalink: /takes
title: Takes
content-type: static
---

<div class="takes-page">
  <p class="takes-desc">A running catalog of opinions — things worth experiencing, worth skipping, and everything in between.</p>

  {% for category in site.data.takes.categories %}
  <section class="takes-section" id="{{ category.id }}">
    <p class="takes-section-label">{{ category.label }}</p>
    <div class="takes-grid">
      {% for item in category.items %}
      <div class="home-rec-card">
        <div class="home-rec-header">
          <span class="home-rec-type">{{ item.type }}</span>
          <span class="home-rec-rating home-rec-rating--{{ item.rating | downcase }}">{{ item.rating }}</span>
        </div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.desc }}</p>
      </div>
      {% endfor %}
    </div>
  </section>
  {% endfor %}
</div>
