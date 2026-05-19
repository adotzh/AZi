---
title: System Design of Search Engine
feed: show
date: 2024-09-30
permalink: /posts/system-design-of-search-engine
---

Search looks simple from the outside: type a query, get ten blue links. Under the hood it is one of the most interesting large-scale system design problems: crawling, distributed storage, low-latency retrieval, machine-learned ranking, spam resistance, freshness, personalization, and evaluation all have to work together.

This note sketches how I would design a modern web search engine, using public examples from Google and Yandex as reference points.

## The product contract

A search engine optimizes for a deceptively hard promise:

- understand what the user means
- find candidate documents from a huge corpus
- rank them by usefulness, trust, and intent match
- return results in hundreds of milliseconds
- keep the index fresh as the web changes
- learn from feedback without overfitting to noisy clicks

The core architecture usually separates into two worlds:

1. **Offline systems** that crawl, parse, index, train models, compute document signals, and build serving artifacts.
2. **Online systems** that understand a query, retrieve candidates, rank them, blend verticals, and render the result page.

## High-level architecture

```text
Web / feeds / APIs
      ↓
Crawler → fetcher → parser → canonicalizer
      ↓
Document store + link graph + feature store
      ↓
Inverted index + vector index + freshness index
      ↓
Query understanding
      ↓
Candidate retrieval
      ↓
Multi-stage ranking
      ↓
Blending, snippets, safety/spam filters
      ↓
Search results page
      ↓
Logs, judgments, experiments, model training
```

The important design choice is that ranking is not one model. It is a cascade.

<div class="search-visual search-architecture" aria-label="Search engine architecture visualization">
  <div class="search-visual-row">
    <span>Web</span>
    <span>Crawl</span>
    <span>Parse</span>
    <span>Index</span>
  </div>
  <div class="search-visual-row">
    <span>Query</span>
    <span>Retrieve</span>
    <span>Rank</span>
    <span>Blend</span>
  </div>
  <div class="search-visual-footer">Offline corpus building feeds online retrieval and ranking.</div>
</div>

## Crawling and indexing

The crawler starts with known URLs, sitemaps, feeds, backlinks, and user-discovered URLs. A frontier service prioritizes what to fetch next based on:

- page importance
- expected freshness
- host politeness limits
- duplicate probability
- historical content quality
- crawl budget

After fetching, pages go through parsing and normalization:

- HTML cleanup
- language detection
- boilerplate removal
- canonical URL selection
- duplicate and near-duplicate detection
- text extraction
- structured data extraction
- link graph updates

The output is stored in several indexes:

- an **inverted index** for lexical retrieval
- a **forward index** for document features and snippets
- a **link graph** for authority-style signals
- a **vector index** for semantic retrieval
- a **freshness index** for newsy or rapidly changing pages

Classic search still needs the inverted index. Dense embeddings help with semantic recall, but lexical matching remains hard to beat for exact names, rare terms, code, product IDs, and navigational queries.

## Query understanding

Before retrieval, the system rewrites and interprets the query:

- spelling correction
- tokenization and normalization
- language and region detection
- entity recognition
- intent classification
- query expansion
- synonym matching
- freshness detection
- vertical detection, such as web, images, maps, shopping, news

This is where modern language models matter. Google publicly describes systems such as **RankBrain**, **neural matching**, and **BERT** as helping Search understand concepts, word relationships, and intent. BERT is especially useful for compositional meaning: small words like “to” or “for” can change what the user is asking.

Example:

```text
2019 brazil traveler to usa need a visa
```

A bag-of-words system can match pages about U.S. citizens traveling to Brazil. A better language-understanding model should understand the direction: a traveler from Brazil going to the U.S.

## Candidate retrieval

At web scale, the ranking model cannot score every document. The system first retrieves a few thousand or tens of thousands of candidates from multiple retrievers:

- BM25 / lexical retrieval
- phrase and proximity matchers
- anchor-text retrieval
- entity and knowledge graph retrieval
- semantic vector retrieval
- freshness/news retrieval
- personalized or local candidates

The retrieval stage optimizes recall. It is okay if many candidates are mediocre, as long as the good ones are not missed.

## Ranking as a cascade

A practical ranking stack often has several stages:

<div class="search-visual ranking-cascade" aria-label="Ranking cascade visualization">
  <div>
    <strong>100k+</strong>
    <span>raw matches</span>
  </div>
  <div>
    <strong>10k</strong>
    <span>retrieved candidates</span>
  </div>
  <div>
    <strong>1k</strong>
    <span>main ranker</span>
  </div>
  <div>
    <strong>100</strong>
    <span>neural reranker</span>
  </div>
  <div>
    <strong>10</strong>
    <span>final page</span>
  </div>
</div>

### 1. Lightweight ranker

Scores many candidates using cheap features:

- term match
- title match
- URL/domain signals
- document language
- freshness
- PageRank-like link authority
- spam score
- basic user/location match

### 2. Main ranking model

Scores hundreds or thousands of candidates with richer features:

- query-document text features
- click and satisfaction aggregates
- authority and trust signals
- freshness and topicality
- document quality
- result diversity
- intent match
- vertical-specific features

Yandex is a useful public example here. Yandex developed **MatrixNet**, a gradient-boosted decision-tree system used in ranking, and later open-sourced **CatBoost**, which Yandex describes as a successor to MatrixNet and useful for ranking tasks. Gradient boosting is popular in ranking because it handles heterogeneous tabular features very well.

### 3. Neural reranker

Scores the top candidates with more expensive models:

- cross-encoder BERT-style query-document models
- passage-level relevance models
- answer extraction models
- freshness-aware or vertical-specific neural models

The neural reranker has high precision but is expensive, so it runs late in the cascade.

### 4. Blending and final page construction

The final page is not just a ranked list. It may blend:

- organic web results
- maps
- images
- videos
- news
- shopping
- knowledge panels
- direct answers
- related questions

The blender decides which result types to show and where. This is a ranking problem too: for a restaurant query, maps may deserve the top slot; for a breaking event, news may dominate; for a programming query, documentation or Stack Overflow-like pages may be better.

<div class="search-visual blend-grid" aria-label="Search result blending visualization">
  <div><strong>Web</strong><span>organic pages</span></div>
  <div><strong>Maps</strong><span>local intent</span></div>
  <div><strong>News</strong><span>freshness intent</span></div>
  <div><strong>Answers</strong><span>direct response</span></div>
</div>

## Feature examples

Useful ranking features might include:

- BM25 score
- title exact-match score
- query term proximity
- anchor text score
- language match
- country/region match
- freshness score
- document quality score
- spam probability
- site authority
- PageRank-like graph score
- click-through rate, debiased
- long-click or satisfaction proxy
- query intent class
- entity overlap
- embedding similarity
- BERT cross-encoder score

No single feature is enough. A good search engine survives because it combines weak signals into a robust system.

## Learning to rank

Training data comes from several sources:

- human relevance judgments
- click logs
- dwell time and reformulation signals
- interleaving experiments
- A/B tests
- synthetic labels from stronger models

Click data is useful but biased. Top-ranked results get more clicks because they are top-ranked. A search engine needs counterfactual logging, randomized exploration, interleaving, or debiasing methods to avoid learning its own previous mistakes.

Common ranking objectives:

- pairwise ranking losses
- listwise ranking losses
- NDCG optimization
- click/satisfaction prediction
- multi-objective utility functions

The hard part is not just training the model. It is choosing the metric. A model that increases clicks can still make search worse if it rewards sensational pages, clickbait, or quick pogo-sticking.

## Google-style design notes

Public Google Search documentation describes multiple ranking systems working together rather than one monolithic algorithm:

- **RankBrain** helps relate words to concepts.
- **Neural matching** helps match broader representations of queries and pages.
- **BERT** helps understand how combinations of words express meaning and intent.

System-design lesson: language understanding is part of retrieval and ranking, not a separate “NLP feature.” It changes which candidates are found, how they are scored, and which result types are blended into the page.

## Yandex-style design notes

Yandex is a strong example of industrial learning-to-rank:

- **MatrixNet** was used to construct ranking formulas.
- **CatBoost** evolved from this family of gradient-boosted decision-tree systems and is public.
- Ranking models in this style are powerful because search has many non-neural signals: text statistics, graph signals, user behavior aggregates, freshness, geography, and quality features.

System-design lesson: even in the neural era, boosted trees are still extremely practical for ranking pipelines because they are fast, interpretable enough, and strong on tabular features.

## Latency budget

A search request might have a budget like:

```text
query parsing              5-15 ms
candidate retrieval       20-60 ms
feature fetching          10-40 ms
first-stage ranking       10-30 ms
neural reranking          20-80 ms
blending/snippets         10-40 ms
network/rendering         remaining budget
```

<div class="search-visual latency-bars" aria-label="Latency budget visualization">
  <div><span>query parsing</span><b style="--w: 16%"></b><em>5-15 ms</em></div>
  <div><span>candidate retrieval</span><b style="--w: 60%"></b><em>20-60 ms</em></div>
  <div><span>feature fetching</span><b style="--w: 40%"></b><em>10-40 ms</em></div>
  <div><span>ranking</span><b style="--w: 50%"></b><em>10-80 ms</em></div>
  <div><span>blending/snippets</span><b style="--w: 35%"></b><em>10-40 ms</em></div>
</div>

This forces tradeoffs:

- precompute document features offline
- cache popular queries
- shard indexes carefully
- use early exits
- run expensive models only on top candidates
- degrade gracefully when a service is slow

## Reliability and freshness

Search has several freshness layers:

- real-time or near-real-time indexing for news and urgent pages
- frequent recrawling for important pages
- slower background crawling for stable pages
- deletion handling and canonical updates

Serving must tolerate partial failure. If the vector retrieval service is down, lexical search should still work. If the neural reranker times out, first-stage ranking should still return reasonable results.

## Evaluation

Offline metrics:

- NDCG
- MRR
- precision at k
- recall at k
- calibration
- latency
- freshness lag
- spam rate

Online metrics:

- long clicks
- reformulation rate
- abandonment rate
- successful session rate
- manual quality review
- guardrail metrics for spam, safety, and diversity

The most important evaluation question is qualitative: did the user finish the task?

## A minimal version

If I had to build a small search engine first:

1. Crawl a controlled corpus.
2. Build an inverted index with BM25.
3. Add document parsing, canonicalization, and snippets.
4. Add a feature store and a small learning-to-rank model.
5. Add vector retrieval for semantic recall.
6. Add a neural reranker for the top 100 documents.
7. Add click/judgment logging and an evaluation loop.
8. Add freshness, spam detection, and vertical blending.

The beautiful thing about search is that every layer can be improved independently, but every layer also changes the others. Retrieval affects ranking. Ranking affects clicks. Clicks affect training. Training affects what the system believes users want. Search is not just an information retrieval problem; it is a living feedback system.

## References

- [Google Search ranking systems guide](https://developers.google.com/search/docs/appearance/ranking-systems-guide)
- [Google: Understanding searches better than ever before](https://blog.google/products-and-platforms/products/search/search-language-understanding-bert/)
- [Yandex CatBoost](https://yandex.com/dev/catboost/index/)
- [Yandex MatrixNet](https://yandex.com/support/partner/en/technologies/matrixnet)
