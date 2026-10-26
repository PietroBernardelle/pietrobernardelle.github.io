---
title: "From asking a question to search agents"
excerpt: "Why we look for information, how we express a need, and the ideas that connect a question to useful evidence."
date: 2026-10-26
tags: [information retrieval, roadmap]
series: information-retrieval
part: 1
layout: focus
---

When I think about search, it's tempting to jump straight to the methods. But before we match words or rank results, someone has to want to know something and decide where to look.

That's where I want to start this series, with the person asking the question.

## Someone needs to know something

Think about the last time you needed information. Maybe you were planning a trip and couldn't work out which train to catch. Maybe a sentence in a book made no sense, or someone mentioned an idea you wanted to understand. You knew enough to notice something was missing, but not enough to move on comfortably.

Sometimes the reason is practical. You have a decision to make, and knowing a little more would help you make it. Sometimes it's curiosity. You don't need to do anything with the answer, you just want to understand. You might also be looking for reassurance, another opinion, or a way to check something you've been told.

Let's keep one example with us. You're playing football, you land awkwardly, and your ankle hurts. At first, there might not be a neatly formed question in your head. You just know something has happened and you're unsure what it means. Whether you can carry on playing, whether you should get help, and how long recovery might take are different things you could want to know.

That missing understanding is what we'll call an **information need**. It can be specific, but it can also start as a vague feeling that you don't know enough yet. The need comes from the situation you're in, what you already know, and what you're trying to do.

You might ask a teammate, speak to someone with relevant experience, or remember something you were taught. Choosing whom to ask is already part of the process. Someone nearby is easy to reach, but you may want a more knowledgeable source before deciding what to do.

For me, this is a useful starting point. Looking for information is something we do to make sense of a situation. The tools come after that.

## Turning the need into a question

Now imagine trying to explain what's missing. You could ask a teammate, "Do you think this is serious?" They can see you sitting on the ground, and they may have seen the awkward landing. A lot of the context is shared, so you don't need to say it.

If you're asking someone who wasn't there, you have more explaining to do. You might describe what happened, where it hurts, and what you're worried about. Even then, the person might ask a follow-up question before they understand what you need.

This is one reason asking a useful question can be harder than it sounds. You may not know the right vocabulary. You may be unsure which details matter. You can also ask about one thing while really trying to work out another. "How long does an ankle sprain take to heal?" might be your way of asking whether you'll be able to play next weekend.

The question can change as you learn. An explanation might introduce a term you haven't heard before, or make you realise that your first assumption was wrong. You ask again, with a slightly better idea of what you need. Finding information and working out the question often happen together.

## Someone has something to share

The person sharing what they know has their own reasons for doing so. A teammate might tell you about their own experience with an ankle injury because they want to help. A physiotherapist might explain a common misunderstanding because they keep hearing the same question.

People share for other reasons too. A researcher might want others to examine their findings or build on their work. Someone writing a guide might enjoy teaching, want feedback, or hope to become known for what they do. A business might publish advice to attract customers. Several of these reasons can exist together.

The audience shapes the explanation as well. A physiotherapist talking to another physiotherapist can assume knowledge that a beginner doesn't have. Someone describing their own recovery may focus on what surprised them, while a guide might aim to answer the questions people ask most often.

Writing it down or recording it lets that explanation travel beyond the original conversation. Someone else can come back to it later, without having to know or meet the person who shared it.

## Finding what someone else has shared

That leaves us with a different problem. Someone may already have recorded something useful in a book, a set of notes, a manual, or a research paper. We need a way to find it among everything else people have shared. A search system helps us look through that material.

In information retrieval, we often call the items being searched **documents**. The word is broader than it sounds. A document could be a whole article, a paragraph, a transcript, or a record in a database. A web page is one possibility, but search doesn't have to involve the web at all.

The **collection** is the material available to search. A system can only retrieve material it has access to, so what goes into the collection matters before we choose any ranking method.

When we give a search system a request, we call that request a **query**. It might be a few keywords or a whole sentence. Either way, it's our attempt to express the need in a form the system can work with. Keeping the need and the query separate helps explain a lot of what follows.

For our ankle example, imagine a small collection of health information. We type *treat sprained ankle*, and the system tries to find documents that could help.

```widget
need-to-match
```

Read the figure from left to right. The need contains the situation, the query keeps just a few words, and the documents offer possible answers. The coloured borders mark promising material, rather than a guarantee that each document answers the immediate question. A recovery guide might be useful later, while a first-aid page is more useful beside the pitch.

The rest of the series is about how search systems try to close that gap. Rather than explain every method here, I want to give you the shape of the story. Each part goes into one piece of it in detail, and each can be read on its own.

## Helping the person takes more than matching words

Suppose the system returns an article about exercises for later in recovery. It mentions ankle sprains throughout, so it looks like a good match for our words. But you're still sitting beside the pitch, trying to work out what to do now.

That gap between *matching the words* and *helping the person* is what we call **relevance**, and it's the thing every method in the series is chasing. It's subtler than it sounds, because the same page can be exactly right for one person and useless for another. [Part 2](/blog/what-makes-a-document-relevant/) starts there.

That gives us a goal. Now we need a practical way to look for promising documents.

The words in the query are the obvious place to begin. A system can look for documents that contain them, and give each document a score. A word can contribute more when it appears often in that document and occurs in relatively few documents elsewhere in the collection. That makes a match on "ankle" more informative than a match on "the".

Doing that for millions of documents, in the blink it takes to show a results page, needs preparation. Search engines read documents ahead of time and build an index, much like the one at the back of a book. For each word, it records which documents contain it, often along with details such as how many times it appears. When a query arrives, the system can use those lists to find and score promising documents without reading the whole collection again. [Part 3](/blog/from-text-to-an-index/) builds that index.

Once we can find matching documents, we still need to decide which to show and in what order. [Part 4](/blog/from-boolean-search-to-bm25/) follows two ways of approaching that decision. Simple **yes-or-no rules** keep documents that meet a condition, such as containing both "ankle" and "sprain", and exclude those that don't. This filters the collection down to potentially useful results, but doesn't tell us which qualifying document should come first. **BM25** is a ranking method that gives documents scores based on their matching words, helping the system put the most promising results first. It gives informative matches more weight while limiting how much a document can gain simply by repeating a word, and remains a common reference point for comparing retrieval methods.

## Checking the results, then looking for better clues

Once there's more than one way to rank, we need to know which is better. Researchers do this by fixing a set of documents and questions, asking people to judge which documents help, and measuring how well each system's ranking agrees. Every such measure hides an assumption about how people read results, and choosing one is a small act of modelling. That's [part 5](/blog/how-do-we-know-search-works/), with more on telling real improvements from luck in [Statistics for ML](/blog/series/statistics-for-ml/).

Once we can compare systems, we can start asking where they fail.

Words alone run out quickly. The most useful page for our footballer might say "rolled ankle" and never "sprained". People and authors simply use different words.

There are several ways around this, all older than you might expect. We can change the query, adding related words or learning from the results someone found useful ([part 6](/blog/improving-the-query/)). On the web, pages also link to each other, and those links say something about which pages are trusted and what they're about ([part 7](/blog/search-on-the-web/)). With dozens or hundreds of such clues, the system can learn how to weigh them, from human judgments or from what people click ([part 8](/blog/learning-to-rank/)).

## Giving the system more of the meaning

Underneath all of that, the words were still separate symbols. "Rolled" and "sprained" had nothing in common unless someone said so.

Neural language models changed that. They learn numerical representations from text and training examples. With suitable training, passages that answer similar questions can end up close together even when they share few words ([part 9](/blog/from-words-to-meaning/)). Search engines put these models to work in a few ways, reading a query and a candidate together to reorder a short list ([part 10](/blog/reranking-with-bert/)), turning whole passages into points that can be searched by closeness ([part 11](/blog/dense-retrieval/)), or deciding which words a document *should* be indexed under ([part 12](/blog/learned-sparse-retrieval/)).

## From finding material to writing answers and searching again

The large language models behind today's chat assistants can follow instructions, and that opens new roles for them. They can be asked to rank results directly ([part 13](/blog/llms-as-rankers/)). They can be asked to judge relevance, the job people did when we measured systems, which is part of my own research and raises real questions about how far to trust them ([part 14](/blog/llms-as-relevance-assessors/)).

They can also read the results for us. Instead of a list of links, the system retrieves passages and the model writes an answer from them, with sources to check ([part 15](/blog/rag-from-the-retrieval-side/)). And, coming back to how our questions change as we learn, a model can search, read what it finds, and decide what to look for next, repeating the process while checking whether the evidence is sufficient ([part 16](/blog/search-agents/)).

## The whole map

The map groups the series into six stages. Choose a stage to see the question each part takes on. You can read straight through, or use the map to return to an idea when you need it.

```widget
series-map
```

These ideas don't replace each other so much as stack up. A search agent today might call a tool that uses an index, combines word matching with meaning, and reranks its candidates with a language model. These older ideas are still doing useful work inside newer systems. The timeline below shows when the main approaches emerged, rather than a sequence in which each made its predecessor obsolete.

```widget
search-timeline
```

For me, the thread through all of this is still the person at the start. Finding more information only helps if it gets them closer to understanding what they wanted to know. That's why [part 2](/blog/what-makes-a-document-relevant/) begins with relevance.
