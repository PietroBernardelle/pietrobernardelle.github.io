---
title: "What makes a document relevant?"
excerpt: "Why a page can be on topic without helping, and how the person, task, and moment shape what counts as a useful result."
date: 2026-10-26
tags: [information retrieval, relevance]
series: information-retrieval
part: 2
layout: focus
---

Imagine you've just rolled your ankle during a football match. Sitting beside the pitch, you search for *treat sprained ankle*. The first result is a clear, detailed guide to rehabilitation exercises three weeks into recovery.

It's about the right injury. It may be useful in a few weeks. But it doesn't answer the question you're trying to settle now.

That small mismatch is a good place to begin. Before asking how a search engine scores documents, we need to decide what a good result would actually do for the person searching. In this post, I want to unpack **relevance**, the relationship between what someone needs and what a document offers. The ankle example runs through the series, but you can start here.

## Three things that are easy to blur together

There are three different things in that opening scene.

The **information need** is what the person wants to find out in their situation. Here, it might be whether the injury needs attention and what to do next. The **query** is their attempt to express that need, *treat sprained ankle*. The **documents** are the material the system can return, such as first-aid pages, rehabilitation guides, or research papers.

The query leaves out a lot. A search engine may also have clues from an earlier query or the conversation, but it still doesn't have direct access to the person's uncertainty, knowledge, or intentions. It has to work from the evidence available.

That's a hard job. "Treat sprained ankle" could come from someone who has just been injured, from someone three weeks into recovery, from a physiotherapy student, or from a parent whose child is limping. Each of them would type the same words. Each of them needs something different.

It's tempting to think of relevance as something a document has, like its length or its date. But the same article can be exactly right for one person and useless for another. Recovery exercises are relevant to someone three weeks into rehabilitation. They aren't relevant to someone still sitting beside the pitch.

So relevance is a **relationship** between a document and an information need. Change either side and the answer can change. In the figure below, choose a different searcher. Keep an eye on the recovery guide. The query and documents stay the same, but the reason for searching changes.

```widget
relevance-lens
```

Notice that one column never moves. Whether a document is *on topic* doesn't depend on who is asking. The recovery exercises are about ankle sprains for everyone. What changes is whether the document *helps*.

## Being on topic and being useful

That difference has names. Researchers have described relevance in many ways. For this series, it helps to distinguish the subject of a document, its usefulness to a person, and the score a system assigns.

**Topical relevance**, sometimes called aboutness, asks whether the document is on the same subject as the query. It's the middle column in the figure above.

**User relevance** asks whether the document actually helps this person, right now. That depends on much more than the topic.

- **Usefulness for the task.** Does it help them decide or do something?
- **Understandability.** A clinical paper on ligament grades may be accurate and on topic, but hard to use without medical training.
- **Trustworthiness.** Is it from a credible source? Would you act on it?
- **Novelty.** Does it add something to what they already know, or repeat the last page they read?
- **Freshness.** Is it still current? This matters a lot for some needs, such as timetables, and very little for others.

**System relevance** describes the match estimated by the system, usually represented as a score built from the evidence it has. The goal is for that score to track user relevance as closely as possible. In practice, most systems estimate topical relevance, because that's what the text gives them most directly. The other dimensions come in through extra signals, which we'll meet in later parts.

A classic illustration uses the query *China's great wall*. A page on the wall's history is on topic. A photo gallery is also on topic, and perfect for someone planning a trip but much less useful for someone writing a history essay. A news story using "great wall" as a metaphor for trade barriers shares the words but not the topic. Aboutness and helpfulness overlap, but they aren't the same thing.

## A useful result can change the next question

There's one more complication. Relevance isn't fixed even for one person.

Once our footballer has read that they should stop playing and rest the ankle, a second page saying the same thing is less useful than the first. It's still on topic. It's still correct. But it no longer adds anything. And after reading about the warning signs of a fracture, they might realise they have a new question. How can the source help distinguish those injuries? The need itself has shifted.

This is why searching often feels like a conversation. We look at results, learn something, and ask again, slightly differently. Systems that support that loop, by suggesting related queries, learning from what we click, or searching again on our behalf, are a recurring theme of the series.

This also helps explain why relevance is rarely a clean yes or no.

So far I've talked about relevance as yes or no. Real judgments are often finer than that. A page that answers the question completely is more valuable than one that answers it partly, which is more valuable than one that merely mentions the topic.

That's why test collections, the datasets researchers use to measure search systems, often use grades. A simple scale might use 0 for no useful information, 1 for a partial answer, and 2 for a substantial answer. Assessors need instructions about what those grades mean for the particular task. An authoritative overview and the exact page someone wants to reach aren't necessarily interchangeable kinds of success.

These grades let us distinguish finding *something* on topic from putting a strong answer near the top. [Part 5](/blog/how-do-we-know-search-works/) explains how grades become evaluation scores.

## Why matching words isn't enough

The obvious starting point for a search system is to compare the words in the query with the words in each document. A lot of this series is about how far that idea can go, and where it breaks. There are three main ways it breaks.

**Different words, same meaning.** People can say the same thing in many ways. Someone asking about the "highest-paid Premier League footballer" might be helped by a page describing player salaries without using the word "paid". A page about a "rolled ankle" may be exactly what someone typing "sprained ankle" needs. This is the **vocabulary mismatch** problem, and it will come back again and again.

**Same words, different meaning.** The opposite also happens. "Where is the closest bank?" shares an important word with a page about a walking trail along a river bank. "Apple" means one thing next to "iPhone" and another next to "orchard".

**Short, rough queries.** Queries are usually a few words long, and people often don't know the right vocabulary. Zuccon, Koopman and Palotti looked at this with medical symptoms in "Diagnose this if you can" (ECIR 2015). Picture trying to describe a skin condition you can see in a photo. You might type something like *ring wound below wrinkled eyelid*. The description is honest, but it's a long way from the clinical term that would find the right page.

Try the examples below. Highlighted words appear on both sides.

```widget
vocabulary-gap
```

Shared words are a clue, and often a good one. But they're a clue, not the answer. Three of these documents help with almost no shared words. One shares two words and doesn't help at all.

## Why search usually gives us an ordered list

A precise lookup can have an exact condition. If I ask for the record with account number 12345, a record either has that identifier or it doesn't. Our ankle query leaves much more open. Several documents could help, to different degrees, and the system has to decide which to show first.

That's why search commonly returns a **ranking**, an ordered list of promising results. It gives the person a place to begin while leaving room for uncertainty about their need.

This is a difference between tasks, rather than a strict boundary between technologies. A database can support ranked text search, and a search engine can look up an exact identifier. What matters here is that we are estimating usefulness, rather than checking only a precise condition.

This kind of search, where someone types a new query for whatever they need right now, is called **ad-hoc retrieval**. The name comes from the Latin for "for this purpose". It's the main task we'll follow, although the same ideas appear in related tasks, **filtering**, where the questions are fixed and new documents stream past (think news alerts); **question answering**, where the goal is a direct answer rather than a list; and **recommendation**, where there may be no query at all.

## Someone still has to make the judgment

If relevance is a relationship with a person's need, then ultimately it's a judgment that people make. That raises practical questions we'll have to face when we try to measure search systems.

- **Who judges?** The person who searched is the ideal judge but is rarely available. Usually, trained assessors judge on their behalf, working from a written description of the need.
- **Do judges agree?** Not always. Two careful people can disagree about borderline documents, especially with fine-grained grades.
- **How much can we judge?** A collection may hold millions of documents. Nobody can read them all for every query.

These questions sound like details, but they shape everything. A system can only be as good as our idea of what "good" means, and our ways of checking it. [Part 5](/blog/how-do-we-know-search-works/) is about those ways, and [part 14](/blog/llms-as-relevance-assessors/) asks whether language models could help do the judging.

For me, the useful distinction is between finding a page that talks about the question and finding one that helps someone move forward. Shared words can help us get there, but they don't settle it. Neither does a high score, an impressive title, or a detailed explanation that arrives at the wrong moment.

We'll keep that distinction in view as the machinery gets more complicated. [Next, we'll build an index](/blog/from-text-to-an-index/) so the system can find promising material quickly. Then we can ask how to order it.
