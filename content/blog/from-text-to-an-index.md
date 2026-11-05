---
title: "From raw text to an index"
excerpt: "How a search engine prepares documents ahead of time so a query can follow a few useful lists instead of rereading everything."
date: 2026-11-05
tags: [information retrieval, indexing]
series: information-retrieval
part: 3
layout: focus
---

When someone types *treat sprained ankle*, they expect results almost immediately. Reading every page in a large collection after the query arrives would take far too long. A search engine gets around that by preparing much of the work in advance.

That preparation turns raw text into an **index**, a lookup structure built from the documents. Think of the index at the back of a book, where a word points you to the pages that mention it. For a search engine, a word such as "ankle" points to the documents that contain it. The engine can follow that list instead of reading the whole collection again. In this post, we'll follow a few short documents through that process, from the first decision about what counts as a word to the lists the engine uses when a query arrives.

The goal is to understand what the index makes fast, and what information we might lose while building it. We won't rank the results yet. Finding candidates and deciding which candidate is best are separate jobs.

## Preparing the collection before the query arrives

To keep things concrete, here are eight invented document snippets. We'll reuse this small collection in several examples so we can inspect what the system is doing. Later examples use shortened or expanded versions to make a particular behaviour visible, so document numbers belong to the figure where they appear.

| | Document |
|---|---|
| D1 | A guide to caring for a sprained ankle in the first hours. |
| D2 | Ankle sprain recovery exercises to rebuild strength and balance after three weeks. |
| D3 | How to treat a sprained wrist at home. |
| D4 | When to see a doctor about a twisted ankle, signs it might be a fracture. |
| D5 | Football injuries explained, knees, ankles and hamstrings. |
| D6 | First aid on the pitch for a rolled ankle. |
| D7 | The history of leather football boots. |
| D8 | Ice baths and recovery for runners. |

A search engine runs two separate processes.

The **indexing process** works ahead of time. It gathers documents, by crawling the web, receiving feeds, or reading files. It converts them into plain text, whatever their original format. It splits the text into terms, decides what to keep, and builds data structures for fast lookup.

The **query process** runs when someone searches. It takes the query, processes it the same way, finds matching documents, scores them, and shows the results. Behind the scenes, it also logs what happened, so the system can be analysed and improved.

Keeping the two apart is what makes search practical. The expensive work goes into indexing, which can be reused across many queries and updated when documents change. The query process only does what it must, and does it in milliseconds.

## Deciding what to keep from the text

Before deciding how to process words, it helps to look at how words behave in real text. The pattern is surprisingly regular.

A handful of words are extremely common. Then there's a very long tail of words that appear only once or twice. If you rank words by how often they appear, frequency is roughly inversely proportional to rank. In the simplest version, the second most common word appears about half as often as the first, the third about a third as often, and so on. This is **Zipf's law**, after the linguist George Kingsley Zipf, who described it in the 1930s and 40s.

```widget
zipf-curve
```

This uneven distribution matters when we decide which terms to keep and how to weight them.

- Words at the top appear in nearly every document, so they can't help us tell documents apart. Knowing that a page contains "the" usually tells us little about its topic.
- Words at the very bottom may be names, technical terms, product codes, or typos. Some are noise, but others are exactly what makes a document findable. Rarity alone is no reason to discard them.
- Many useful descriptive terms sit between these extremes. "Sprain", "ankle", "ligament".

Keep this picture in mind. It comes back when we start scoring in [part 4](/blog/from-boolean-search-to-bm25/), and again when we compress the index at the end of this part.

## Making words comparable

**Tokenisation** splits a stream of characters into units we can match. That sounds trivial until you try it.

One simple tokenisation rule, useful for illustrating the trade-off, is to keep runs of letters and digits that are at least three characters long, then convert them to lowercase. This is a minimum length, not a way of cutting words into groups of three characters. Apply that to *Bigcorp's 2007 bi-annual report showed profits rose 10%* and the "10" disappears, and "bi-annual" turns into "annual".

Real text is full of decisions like this.

- **Hyphens.** Is "e-bay" the same as "ebay"? Should "winston-salem" stay together while "spanish-speaking" splits?
- **Capitals.** "Apple" the company and "apple" the fruit, or "Bush" the person and "bush" the plant.
- **Apostrophes.** "o'donnell", "can't", "80's", "master's degree".
- **Numbers and periods.** "iPhone 7", "97.3 FM", "Ph.D.", a web address.
- **Short words.** "world war II", "el paso", "j lo", the short pieces carry the meaning.

There's no rule that gets everything right, so systems usually keep the tokeniser simple and push harder decisions to later stages. For this word-matching pipeline, query and document processing must produce compatible terms. If documents keep "rx-7" as one token and queries split it into two, an exact token match can fail. Later neural methods may use different query and document encoders, but they still need compatible representations.

Let's see those decisions separately. The first row splits the text at spaces and punctuation. The next drops tokens shorter than three characters, and the last converts what remains to lowercase. Try switching the length rule off, or type your own sentence.

```widget
tokenisation-example
```

Splitting the text gives us tokens. We still have to decide whether to keep all of them.

Because the most common words carry so little information, a natural idea is to drop them. These are **stopwords**, function words such as "the", "a", "of" and "to". Remember that the index keeps a list of documents for each word. A common word like "the" may need a list covering almost the entire collection. Leaving that word out means one less list to store and search through, but it also removes distinctions that some queries need.

Consider *to be or not to be*, which many stopword lists would remove almost entirely. "The Who" is a band. "Flights to London" and "flights from London" mean opposite things.

What counts as a stopword also depends on the collection. In the text of links, "click" is nearly meaningless. In clinical records, "patient" appears everywhere and tells you nothing. A good stopword list is tailored to the collection, often by starting from its most frequent words.

One way to keep those options open is to index all terms and decide at query time which to ignore. It costs more space, but lets a system skip "the" for many queries and keep it for "The Who".

Another decision concerns words that differ only in their endings.

One idea can appear in several forms, including "sprain", "sprains", "sprained", "spraining". Someone typing one form usually wants all of them.

**Stemming** reduces these variants to a shared stem, usually by stripping suffixes. There are two broad families.

**Algorithmic stemmers** apply rules. The simplest just removes a final "s", which turns "cats" into "cat" but also "supplies" into "supplie" and "ups" into "up". The best-known algorithmic stemmer is the **Porter stemmer**, from 1980, a cascade of rules that strip suffixes step by step. It's fast and widely used, but it produces stems rather than words ("relat" from "relational") and can make two kinds of mistake. It may merge words that should stay separate or miss variants that should match.

**Dictionary-based stemmers** check a list of known words. The **Krovetz stemmer** is a hybrid. It removes a suffix only if the result is a real word in its dictionary. Its output stays readable, and it merges unrelated words less often, at the cost of missing some variants.

Whether stemming helps depends on the language, collection, and queries. A useful way to think about it is as a trade. It can recover matches we would otherwise miss, but it can also merge distinctions the searcher cares about. Languages with richer word forms make that trade especially important.

Now we can add these two decisions to the example. This time we'll keep short tokens at the splitting stage, so we can see what stopword removal does on its own. Start with the ankle sentence and switch stemming off and on. Then try Hamlet and do the same with stopword removal. Each control changes one step, so you can follow exactly what it keeps, removes, or changes.

```widget
text-pipeline
```

## Keeping the clues that individual words miss

Some meaning lives in combinations of words. "Black sea" means something different from "black" and "sea" appearing anywhere in a document. "Big apple" is less ambiguous than "apple". There are three common ways to recognise phrases.

1. **Grammatical tagging.** A part-of-speech tagger labels each word as a noun, verb, adjective and so on, and phrases are defined as noun groups. It can identify useful groups, but adds processing and can make mistakes.
2. **Word n-grams.** Treat consecutive groups of words as possible phrases. This is simple, but creates many entries. Indexing every sequence of two to five words adds nearly 4,000 sequences for a 1,000-word document.
3. **Positions.** Record where each word appears, and check at query time whether "black" is immediately followed by "sea". This is the most flexible, and it's what most modern engines do.

Documents also have **structure**. A word in a title or heading probably matters more than the same word in a footnote. Web pages mark their structure with HTML, so a parser can tell titles, headings, bold text and links apart. On the web, the clickable text of links pointing *to* a page often describes it better than the page does itself. We'll come back to that in [part 7](/blog/search-on-the-web/).

## The inverted index

We now have terms we can match. Let's return to the lookup structure from the opening and see exactly what it stores. Instead of book pages, our lists will contain document numbers, which are simply identifiers assigned to the documents.

An **inverted index** does the same for a collection. For every term, it stores a list of the documents that contain it. Each entry in that list is called a **posting**, and the list as a whole is a **postings list**. Postings are kept sorted by document number. The structure is "inverted" because a document naturally lists its words; the index flips that around so each word lists its documents.

Build one below from a few ankle documents, then choose what each posting stores.

```widget
inverted-index
```

The postings can carry more than a document number.

- **Counts** record how many times the term appears in each document. This costs little extra space and is essential for ranking, because scoring functions like BM25 depend on it.
- **Positions** record where each occurrence is. This takes much more space, roughly one entry per word in the collection, but it lets the system check phrases ("sprained ankle", in that order) and proximity ("ankle" within five words of "swelling").
- **Fields** record whether the term appeared in the title, body, or a link. There are two simple designs. You can keep a separate index for each field, or add a few bits to each posting saying which field it came from.
- **Extents** record the start and end positions of regions such as sections or tagged entities. A query can then ask for words *inside* a particular region.

These additions take space and can add work, but they also enable lookups that the simpler index could not answer efficiently. That trade between what we store and what we can do with it runs right through the series.

## Following the lists when someone searches

To see how lookup works independently of the ankle example, try the query *tropical fish*. The system fetches the postings list for "tropical" and the list for "fish". Because both are sorted by document number, it can walk through them together with two pointers, always advancing whichever one points to the smaller number. When both pointers land on the same document, that document contains both words.

```widget
postings-merge
```

The important thing is what *doesn't* happen. Documents that contain neither word are never touched. For most queries, that's almost all of the collection.

Once the matching documents are found, they need scores. There are two classic ways of organising that work.

- **Document at a time** processing walks all the query terms' lists together, and finishes the full score for one document before moving to the next. It uses little memory, and it's easy to keep only the current top ten.
- **Term at a time** processing takes one term's whole list, adding partial scores to a running total for each document before moving to the next term. It reads each list in one sequential sweep, which suits disks well.

Both have clever shortcuts that skip documents that can't possibly make the top ten, and those shortcuts are a big reason search engines are as fast as they are.

## Making the same idea work at scale

For a small collection, building the index is simple. Read each document, and for each term, append a posting to that term's list, kept in a table in memory.

Large collections don't fit in memory, so engines build the index in pieces. They fill memory with a partial index, write it to disk, start a fresh one, and repeat. At the end, all the partial indexes are merged. If each partial index stores its terms in alphabetical order, the merge can stream through them all at once, a small piece at a time, without loading any of them fully. Very large engines spread this across many machines.

Alongside the postings, the engine keeps a **vocabulary**, also called a lexicon, which is a lookup table from each term to where its postings list starts on disk. A hash table gives very fast lookups if it fits in memory. A B-tree, the structure many databases use, keeps lookups fast even when the vocabulary lives on disk. Real systems often mix the two.

Once the index is built, there is another way to reduce the work needed to read it.

A positional index can be large. Even though a query reads only selected lists, transferring those lists through storage and memory takes time. Compression reduces the amount of data that must move and lets more of the index fit in fast memory, closer to the processor.

A neat trick makes compression effective. Because postings are sorted, we can store the **gaps** between document numbers rather than the numbers themselves. Documents 3, 4, 6, 7 and 9 become 3, 1, 2, 1, 2. Common words have long lists with tiny gaps. Rare words have large gaps, but short lists.

These gaps preserve the original list exactly. Start at zero and add them in order, giving 3, then 4, then 6, then 7, then 9. Unlike removing stopwords, this is **lossless compression**. We change how the information is stored without throwing any of it away.

But smaller numbers only save space if we give them shorter representations. Storing every gap in a fixed 32-bit slot would use just as much space as storing every document number that way. We need a code whose length changes with the number, while still letting the decoder tell where one number ends and the next begins.

**Elias gamma coding** does this with a short length signal followed by the number in binary. Binary writes numbers using only zeros and ones. For example, 5 is `101`, which needs three bits. In the convention used below, we put one fewer zero than that length in front, giving `00 101`. The spaces here are just for readability.

To decode it, count the zeros before the first one. Two zeros tell us to read three bits, including that first one. Those bits are `101`, so we recover 5 and know exactly where the next code begins. A gap of 1 is simply `1`, while 2 becomes `010` and 3 becomes `011`. That's why small gaps are so useful. They need only a few bits, with no separators between codes. [The gamma-code explanation in *Introduction to Information Retrieval*](https://nlp.stanford.edu/IR-book/html/htmledition/gamma-codes-1.html) describes the same length-and-value idea using a different prefix convention.

**Elias delta coding** takes this one step further. Instead of using a run of zeros to signal the number's binary length, it encodes that length with gamma coding. It then appends the original binary number without its leading one, which the decoder can put back. The [Elias-code overview hosted by UC Irvine](https://ics.uci.edu/~dhirschb/pubs/DC-Sec3.html) explains this construction.

Let's keep 5 as our example. Its binary form `101` has length 3. Gamma encodes that length as `011`. Remove the leading one from `101`, leaving `01`, and join the two pieces to get `011 01`. To reverse it, first decode `011` to recover the length 3. Read the next two bits, `01`, put the leading one back, and we have `101`, or 5 again.

For 5, gamma and delta both use five bits. Delta's advantage appears with larger numbers, where gamma's length signal becomes expensive. For example, 1,024 needs 11 binary digits. Gamma uses 21 bits altogether, while delta uses 17. Delta isn't always shorter, though. For a gap of 2, gamma needs three bits and delta needs four. The distribution of gaps matters when choosing a code.

The example below uses gamma coding. Switch between a common and a rare word, and follow each document number through its gap to its stored bits.

```widget
gap-encoding
```

The processor must decompress those postings before using them. Compression only pays off if decoding is cheaper than waiting for memory to deliver uncompressed data. On modern hardware, where processors are much faster than memory, it usually is. The frequent terms with long postings lists often have small gaps, making those lists good candidates for this kind of compression.

We've moved a lot of effort to a moment when nobody is waiting for an answer. Documents are processed ahead of time, and their terms point to compact lists of places to look. When a query arrives, the engine can follow those lists instead of rereading the collection.

That preparation doesn't tell us which matching document will help most. It tells us where to find evidence for making that decision. [The next post](/blog/from-boolean-search-to-bm25/) turns counts and collection statistics into ranking scores.
