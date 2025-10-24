const puzzles = [
  { answer: 'BAHUBALI', hints: ['Epic Telugu film', 'Directed by S.S. Rajamouli', 'Famous for scale and VFX'] },

  { answer: 'BAAHUBALI: THE BEGINNING', hints: [
    'A man raised by a remote tribe is obsessed with climbing a giant, unconquerable waterfall.',
    'When he finally reaches the top, he discovers a kingdom in turmoil and learns of his own royal lineage.',
    'He infiltrates the capital to rescue a former queen who has been imprisoned in a public square for 25 years.',
    'His actions lead to a massive battle against the kingdom\'s tyrannical ruler.',
    'The film ends on a legendary cliffhanger, revealing a shocking betrayal by a trusted family loyalist.'
  ] },

  { answer: 'EEGA', hints: [
    'A young man is murdered by a wealthy, cruel businessman who is obsessed with the same woman.',
    'He is immediately reincarnated as a common housefly.',
    'As an insect, he retains all the memories of his human life and his murder.',
    'He begins a systematic and ingenious campaign of psychological terror against his killer.',
    'His goals are to protect the woman he loves and to make his killer pay for the crime.'
  ] },

  { answer: 'ARJUN REDDY', hints: [
    'A brilliant but volatile medical student with severe anger issues falls into a deeply intense relationship.',
    'When the woman is forcibly married to someone else by her family, his life completely unravels.',
    'He spirals into a dark, self-destructive abyss of substance abuse, rage, and reckless behavior.',
    'He continues to practice as a surgeon, often while under the influence.',
    'The film is a raw, controversial character study of love, loss, and toxic masculinity.'
  ] },

  { answer: 'RANGASTHALAM', hints: [
    'A cheerful, hearing-impaired man lives a simple life in a rural village.',
    'His village has been oppressed for 30 years by a tyrannical, feudal-minded village president.',
    'His educated older brother, returning from abroad, decides to run against the president in the local election.',
    'This act of political defiance incites a brutal backlash, leading to a devastating personal tragedy.',
    'The simple-minded protagonist must then transform himself into an instrument of calculated revenge.'
  ] },

  { answer: 'MAGADHEERA', hints: [
    'A modern-day dirt-bike racer feels a powerful, unexplainable connection to a woman he just met.',
    'A parallel story, set 400 years in the past, reveals he was a legendary warrior in a kingdom.',
    'The woman was a princess he loved, and a cruel commander who also desired her murdered them both.',
    'All three souls have been reincarnated, and the ancient rivalry is reborn in the present day.',
    'The modern-day hero must now remember his past to save the woman from the same eternal villain.'
  ] },

  { answer: 'POKIRI', hints: [
    'A ruthless, low-level thug joins a powerful mafia gang and quickly rises through the ranks.',
    'He is known for his cold efficiency and willingness to do any job for money.',
    'A new, uncompromising police commissioner has declared an all-out war on the city\'s mafia syndicates.',
    'The thug\'s dangerous life is complicated when he falls in love with an aerobics teacher.',
    'A massive twist reveals the "thug" is actually a deep-undercover police officer on a secret mission.'
  ] },

  { answer: 'JERSEY', hints: [
    'A 36-year-old man, once a brilliant local cricket star, is now unemployed and living a life of failure.',
    'He is suspended from his job after being accused of corruption, which he denies.',
    'His young son hero-worships him and asks for a national team t-shirt for his birthday, but he can\'t afford it.',
    'Motivated by his son\'s wish, he decides to make an impossible comeback to professional cricket.',
    'The film is an emotional story about a father\'s love, battling age, and a hidden, life-threatening condition.'
  ] },

  { answer: 'ATHADU', hints: [
    'A professional assassin is perfectly framed for the public murder of a high-profile politician.',
    'While escaping, he inadvertently causes the death of a man who was traveling home to his village.',
    'The assassin assumes the dead man\'s identity and is accepted into his warm, loving family.',
    'He finds peace and a sense of belonging he never had, all while trying to find the real killer.',
    'The film is a stylish thriller known for its sharp dialogue and a complex, parallel bank heist plot.'
  ] },

  { answer: 'RRR', hints: [
    'A tribal guardian travels to the capital on a mission to rescue a young girl from his community.',
    'The girl was forcibly taken to serve as a "songbird" for a ruthless colonial governor.',
    'A police officer in the colonial force, with his own hidden revolutionary agenda, is tasked with capturing the guardian.',
    'The two men meet, unaware of each other\'s true identities, and form an intense, brotherly friendship.',
    'Their bond is shattered when their opposing, high-stakes missions are finally revealed.'
  ] },

  { answer: 'MAHANATI', hints: [
    'An alcoholic young journalist is reluctantly assigned to write about a legendary actress who is in a coma.',
    'As she investigates, the film flashes back to chronicle the actress\'s meteoric rise to stardom.',
    'It details her tumultuous, secret relationship with an already-married established actor.',
    'The story shows how this relationship led to her tragic downfall, isolation, and financial ruin.',
    'The journalist, by uncovering the truth, finds a new purpose in her own troubled life.'
  ] }

  ,{ answer: 'ALA VAIKUNTHAPURRAMULOO', hints: [
    'A man grows up resenting his cold, middle-class father, constantly feeling like he doesn\'t belong.',
    'He discovers a shocking truth: he was deliberately swapped at birth by his father.',
    'He is the true heir to a massive business empire, while the boss\'s son is living his life.',
    'He decides to enter his real family\'s dysfunctional home as an employee to secretly fix their problems.',
    'The film\'s title refers to the name of the house he is trying to save.'
  ] },

  { answer: 'PUSHPA: THE RISE', hints: [
    'The story follows the meteoric rise of a low-wage laborer in the illegal red sandalwood smuggling syndicate.',
    'He uses his cunning and defiant attitude to outsmart his bosses and the police.',
    'A core part of his identity and motivation is his insecurity over his illegitimate birth.',
    'He builds a powerful empire but faces a new, formidable obstacle in a bald, arrogant police superintendent.',
    'The film is the first part of a two-part epic and is known for the protagonist\'s catchphrase, "I won\'t bow down."'
  ] },

  { answer: 'SRIMANTHUDU', hints: [
    'The billionaire heir to a massive business empire feels disconnected from his wealth.',
    'He decides to adopt his ancestral, underdeveloped village to improve its conditions.',
    'His efforts are blocked by a local politician and his brother, who control the village.',
    'He must use his own resources and intelligence to fight these local goons and win over the villagers.',
    'The film\'s central theme is about giving back to one\'s "roots."'
  ] },

  { answer: 'ATTARINTIKI DAREDI', hints: [
    'A billionaire, in exile, is tasked by his grandfather with one mission: find his estranged aunt.',
    'He must convince his aunt, who hates her father, to return to the family home after 25 years.',
    'To get close to her, he infiltrates her household by posing as a simple car driver.',
    'While undercover, he must solve all of his aunt\'s financial and family problems from the shadows.',
    'The film is a family drama about healing old wounds and a promise made to a patriarch.'
  ] },

  { answer: 'BOMMARILLU', hints: [
    'A young man\'s entire life is micromanaged by his loving but extremely overbearing father.',
    'His father has already arranged his marriage to a "perfect" girl from a "perfect" family.',
    'The son, however, falls in love with a vibrant, independent, and slightly eccentric girl.',
    'He proposes that his new girlfriend live in their family home for one week to win everyone over.',
    'The film is a famous critique of "helicopter parenting" and the clash between two different family values.'
  ] },

  { answer: 'VEDAM', hints: [
    'This is a hyperlink film telling five separate stories that converge.',
    'The characters include: a cable operator needing money, a poor weaver in debt, and a prostitute trying to escape her life.',
    'The other two stories follow an aspiring rockstar and an elderly Muslim man facing prejudice.',
    'All five characters\' paths lead them to the same place: a large city hospital.',
    'Their disconnected lives are all violently brought together during a sudden terrorist attack on the hospital.'
  ] },

  { answer: 'KSHANAM', hints: [
    'An investment banker in another country receives a frantic call from his ex-girlfriend.',
    'She claims her young daughter has been kidnapped and begs him to come help find her.',
    'When he arrives, he finds no evidence the child ever existed; even the husband says they are childless.',
    'Everyone, including the police, believes the woman is mentally unstable and hallucinating.',
    'The protagonist must race against time to find the "phantom" child, whom only he believes is real.'
  ] },

  { answer: 'PELLI CHOOPULU', hints: [
    'A lazy, directionless young man and an ambitious, focused young woman meet at a "matchmaking" session.',
    'They accidentally get locked in a room and end up sharing their frustrations and life goals.',
    'They decide to become business partners, combining her ambition with his hidden talent for cooking.',
    'Their joint venture is one of the city\'s first modern food trucks.',
    'The film is a light-hearted, modern story about entrepreneurship, love, and earning parents\' respect.'
  ] },

  { answer: 'GOODACHARI', hints: [
    'The son of a presumed-dead national agent dreams of joining the same secret service agency.',
    'He is recruited into a black-ops division, but on his graduation day, his superiors are assassinated.',
    'He is perfectly framed as the killer and is declared a national terrorist by his own agency.',
    'He must go on the run, using his training to evade his former colleagues and find the real mole.',
    'His investigation uncovers a personal, family-related conspiracy much deeper than he imagined.'
  ] },

  { answer: 'C/O KANCHARAPALEM', hints: [
    'This film is an anthology of four distinct love stories set within a single, small town.',
    'The stories span different ages: a schoolboy\'s crush, a young man\'s inter-caste romance, and a middle-aged man\'s new love.',
    'The film explores themes of love, religion, caste, and societal prejudice across generations.',
    'The entire film was shot using non-professional actors who are all residents of the town.',
    'A major, final twist reveals a secret, overarching connection between all four stories and the film\'s narrator.'
  ] }
  ,{ answer: 'MARYADA RAMANNA', hints: [
    'A man travels to a rural village to claim a piece of land left to him by his parents.',
    'He is welcomed into the home of a family who, unbeknownst to him, has a long-standing, bloody feud with his family.',
    'The family has a strict code of honor: they cannot harm anyone who is a guest *inside* their house.',
    'The entire film becomes a tense cat-and-mouse game as the family tries to get him to step outside, and he tries to escape.',
    'A key prop in his escape plan is a high-tech, remote-controlled toy.'
  ] },

  { answer: 'GAMYAM', hints: [
    'A wealthy, sheltered young man embarks on a journey to find his girlfriend, who left him to do social work in a remote area.',
    'His only companion on the road trip is a cynical, petty thief he just met, who plans to rob him.',
    'Their journey exposes the rich man to the harsh realities of rural poverty and crime.',
    'The thief, in turn, is slowly changed by the rich man\'s unwavering optimism and love.',
    'The film\'s title translates to "The Goal" or "Destination."'
  ] },

  { answer: 'SYE', hints: [
    'A college is completely divided by two warring student gangs.',
    'A local mafia don buys off the college principal and demands the college\'s land to build a factory.',
    'To save their college, the two rival student gangs are forced to unite against the common enemy.',
    'The don makes a wager: the students must play his professional team in a single, high-stakes match.',
    'The sport they must learn and play is rugby.'
  ] },

  { answer: 'JALSA', hints: [
    'A young man, now a seemingly happy-go-lucky college student, has a dark, violent past.',
    'He was once a high-ranking member of a revolutionary "people\'s war" group.',
    'He falls in love with a woman whose father is a high-ranking police officer.',
    'Unbeknownst to him, her father is the very same officer who was his nemesis during his revolutionary days.',
    'His past comes back to haunt him, forcing him to confront his old life and his new love.'
  ] },

  { answer: 'JULAYI', hints: [
    'A young man believes in "shortcuts" and "easy money" rather than hard work.',
    'He accidentally becomes the key witness in a massive bank robbery, helping the police foil the robbers\' plan.',
    'The heist\'s mastermind, a cool and calculating criminal, begins to hunt the young man.',
    'The film is a battle of wits between the hero (who uses shortcuts) and the villain (who uses meticulous planning).',
    'The title translates to "Vagabond" or "Wanderer."'
  ] },

  { answer: 'MANAM', hints: [
    'A successful, 30-something businessman is haunted by the memory of his parents, who died in a car accident when he was a child.',
    'He encounters a young boy and a young girl who are the exact reincarnations of his dead parents.',
    'His life\'s new mission becomes to make his "reincarnated" parents meet and fall in love again.',
    'The plot is further complicated by the appearance of *another* reincarnated couple from his parents\' past.',
    'The film is a multi-generational romance spanning 100 years and was a real-life tribute to a legendary acting family.'
  ] },

  { answer: 'FIDAA', hints: [
    'A US-based medical student travels to a small Indian village for his brother\'s arranged marriage.',
    'He falls in love with the bride\'s younger sister, a feisty, independent woman who is deeply attached to her village and her father.',
    'He proposes, but she refuses, as she is unwilling to leave her homeland to live in America.',
    'Their long-distance relationship is a clash of cultures, egos, and family duties.',
    'The central conflict is her fierce love for her "roots" versus his desire for her to join his life abroad.'
  ] },

  { answer: 'AWE', hints: [
    'The film takes place almost entirely within a single, large, and quirky diner.',
    'It follows multiple, seemingly unrelated characters: a time-traveler, a chef, a drug addict, a magician, and a woman visiting her "parents."',
    'Each story is increasingly bizarre and high-concept, exploring different genres from sci-fi to horror.',
    'A woman sitting at a table by herself is revealed to be the link between all these stories.',
    'The final twist reveals all the characters are alternate personalities of this one woman, who is suffering from a severe dissociative disorder.'
  ] },

  { answer: 'S/O SATYAMURTHY', hints: [
    'After the sudden death of his billionaire father, a young man loses his entire fortune to creditors.',
    'Instead of fighting in court, he chooses to honor his father\'s good name and starts from zero.',
    'He learns his father had one outstanding debt: a plot of land owed to a man in a remote village.',
    'He travels to the village to give up his last remaining asset, only to fall in love with the man\'s daughter.',
    'To win her hand, he must solve a dangerous family feud, all while hiding his true identity.'
  ] },

  { answer: 'OOPIRI', hints: [
    'A wealthy, brilliant man is left a quadriplegic after a para-gliding accident.',
    'He lives a structured, joyless life, interviewing candidates for a live-in caretaker.',
    'He unexpectedly hires a brash, small-time thief who is fresh out of prison and only applied for the job to get a signature.',
    'The film chronicles their unlikely friendship as the caretaker brings chaos and adventure back into the man\'s life.',
    'In return, the wealthy man teaches his caretaker about art, culture, and self-respect.'
  ] }
];

export default puzzles;

