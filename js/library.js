/**
 * Curated Adult Practice Library for Cursive Workbook Generator
 * Categories: Philosophy, Literature & Poetry, Pangrams & Drills, Mindful Affirmations
 */

const CURATED_LIBRARY = [
  {
    category: "Philosophy & Stoic Wisdom",
    items: [
      {
        title: "Marcus Aurelius – Mind and Strength",
        author: "Marcus Aurelius (Meditations)",
        text: "You have power over your mind - not outside events. Realize this, and you will find strength. Very little is needed to make a happy life; it is all within yourself, in your way of thinking."
      },
      {
        title: "Seneca – On the Shortness of Life",
        author: "Lucius Annaeus Seneca",
        text: "It is not that we have a short time to live, but that we waste a lot of it. Life is long enough, and a sufficiently generous estimate has been given to us for the highest achievements, if it were all well invested."
      },
      {
        title: "Epictetus – Freedom and Mastery",
        author: "Epictetus (Discourses)",
        text: "No man is free who is not master of himself. Wealth consists not in having great possessions, but in having few wants. First say to yourself what you would be; and then do what you have to do."
      },
      {
        title: "Lao Tzu – The Flow of Nature",
        author: "Lao Tzu (Tao Te Ching)",
        text: "Water is fluid, soft, and yielding. But water will wear away rock, which is rigid and cannot yield. As a rule, whatever is fluid, soft, and yielding will overcome whatever is rigid and hard."
      }
    ]
  },
  {
    category: "Classic Literature & Poetry",
    items: [
      {
        title: "Jane Austen – Pride and Prejudice",
        author: "Jane Austen",
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be upon his first entering a neighbourhood."
      },
      {
        title: "Ralph Waldo Emerson – Self-Reliance",
        author: "Ralph Waldo Emerson",
        text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. Insist on yourself; never imitate. Your own gift you can present every moment with the cumulative force of a whole life's cultivation."
      },
      {
        title: "Henry David Thoreau – Living Deliberately",
        author: "Henry David Thoreau (Walden)",
        text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived."
      },
      {
        title: "Emily Dickinson – Hope with Feathers",
        author: "Emily Dickinson",
        text: "Hope is the thing with feathers that perches in the soul, and sings the tune without the words, and never stops at all, and sweetest in the gale is heard; and sore must be the storm that could abash the little bird."
      },
      {
        title: "William Shakespeare – Sonnet 18",
        author: "William Shakespeare",
        text: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer's lease hath all too short a date."
      },
      {
        title: "Robert Frost – The Road Not Taken",
        author: "Robert Frost",
        text: "Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could to where it bent in the undergrowth; then took the other, as just as fair."
      }
    ]
  },
  {
    category: "Pangrams & Penmanship Drills",
    items: [
      {
        title: "Classic & Poetic Pangrams",
        author: "Handwriting Warmup",
        text: "Sphinx of black quartz, judge my vow. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!"
      },
      {
        title: "Flowing Ligature Drills",
        author: "Cursive Rhythm Practice",
        text: "minimum aluminum autumn onion illumination million illusion limit minimum humming summer summit autumn immune muniment."
      },
      {
        title: "Ascender & Descender Balance",
        author: "Stroke Proportion Drill",
        text: "The elegant quick silver fountain pen glided effortlessly down the gentle valley of blue shadows, balancing every loop with delicate symmetry."
      },
      {
        title: "Spencerian Slant Cadence",
        author: "Rhythmic Movement",
        text: "Patience and continuous oval motion give grace to every capital letter. Glide lightly on the ascending stroke and shade firmly on the main stem."
      }
    ]
  },
  {
    category: "Mindfulness & Affirmations",
    items: [
      {
        title: "The Art of Slow Handwriting",
        author: "Mindful Practice",
        text: "In the quiet cadence of each stroke, my attention settles into the present. There is no rush; every loop and connection is an exercise in gentle focus, rhythm, and grace."
      },
      {
        title: "Clarity and Gratitude",
        author: "Daily Reflection",
        text: "Gratitude turns what we have into enough. With each word penned upon this page, I cultivate stillness in my thoughts, clarity in my purpose, and steady poise in my hand."
      }
    ]
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CURATED_LIBRARY };
}

