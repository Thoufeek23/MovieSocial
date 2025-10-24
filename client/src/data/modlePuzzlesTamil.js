const puzzles = [
  {
    answer: 'ANNIYAN',
    hints: [
      'A mild-mannered lawyer is deeply frustrated by the public\'s apathy towards rules and corruption.',
      'He develops an alternate, violent personality to punish wrongdoers.',
      'His methods for punishment are drawn from an ancient mythological text.',
      'A police officer and a psychiatrist close in on him, realizing he is suffering from a rare psychological condition.',
      'The film\'s conflict centers on which of his three personalities will ultimately remain in control.'
    ]
  },
  {
    answer: 'MUTHU',
    hints: [
      'A kind-hearted chariot driver works for a generous landlord on a large estate.',
      'Both the driver and his landlord fall in love with the same woman, a visiting stage actress.',
      'The landlord\'s jealous uncle plots to frame the driver for theft to seize the family\'s property.',
      'A loyal servant reveals a hidden truth: the driver is the true, disguised heir to the estate.',
      'The film is famous for a philosophical song about "when I will arrive."'
    ]
  },
  {
    answer: 'PUDHU PETTAI',
    hints: [
      'A young boy, after a family tragedy, runs away from home and ends up in a brutal city slum.',
      'He joins a small gang and, through violence and cunning, begins his rise in the criminal underworld.',
      'The film is a dark chronicle of his journey from a desperate youth to a powerful gangster-politician.',
      'He is haunted by his actions and the betrayal of his closest friend.',
      'The story is told as a long, gritty flashback, framed by his new life in politics.'
    ]
  },
  {
    answer: 'AARANYA KAANDAM',
    hints: [
      'The entire story of this neo-noir film takes place over a single day.',
      'A large shipment of illegal goods is the prize in a complex game of chess between multiple factions.',
      'The players include an aging don, his unfaithful young wife, his trusted general, and a rival gang.',
      'A down-on-his-luck man and his young son get accidentally involved in the power struggle.',
      'The film\'s non-linear story is divided into chapters, each named after a part of a folk tale.'
    ]
  },
  {
    answer: 'PARIYERUM PERUMAL',
    hints: [
      'A young law student from an oppressed community faces constant humiliation at his college.',
      'His only "crime" is befriending a female classmate from a dominant caste.',
      'The film is a raw examination of the caste-based discrimination present in educational institutions.',
      'His beloved dog, a symbol of his identity, is killed in a brutal act of prejudice.',
      'The student\'s ultimate goal is not revenge, but to simply be able to "sit" as an equal.'
    ]
  },
  {
    answer: 'VADA CHENNAI',
    hints: [
      'This film chronicles over 30 years of gang warfare and politics in a North Chennai fishing hamlet.',
      'A proficient carrom player is reluctantly drawn into the local criminal world.',
      'The plot revolves around a complex web of betrayal, smuggling, and the murder of a beloved local leader.',
      'The story explores how the lives of the residents are shaped by the sea and by crime.',
      'This film is the first installment of an intended epic trilogy.'
    ]
  },
  {
    answer: 'MANKATHA',
    hints: [
      'A suspended, corrupt police officer learns of a massive, impending heist.',
      'The target is a huge sum of money related to illegal cricket betting.',
      'He joins the group of four men planning the heist, pretending to help them.',
      'His true plan is to double-cross everyone and escape with the entire sum himself.',
      'The film is a "cat and mouse" game where it\'s unclear who is good and who is bad until the very end.'
    ]
  },
  {
    answer: 'SOODHU KAVVUM',
    hints: [
      'A small-time group decides to start a "kidnapping" business with a set of unique, \'professional\' rules.',
      'The leader of the group has an imaginary friend who acts as his conscience and guide.',
      'Their "perfect" low-stakes business model is ruined when they accidentally kidnap a politician\'s son.',
      'The situation spirals into chaos, involving a "stone" of great value and a humorously tough police officer.',
      'The film is a dark comedy about a series of failed abductions.'
    ]
  },
  {
    answer: 'IRUVAR',
    hints: [
      'This film is a fictionalized epic about the friendship and fallout between two ambitious men.',
      'One is a struggling actor who becomes a matinee idol; the other is a sharp political writer.',
      'They both rise to power within the same political party, using cinema to spread their ideology.',
      'Their friendship shatters due to ideological differences, leading to a decades-long political rivalry.',
      'The film is a sweeping look at the intersection of Tamil cinema and state politics.'
    ]
  },
  {
    answer: 'MOUNA RAGAM',
    hints: [
      'A young woman is forced into an arranged marriage.',
      'She is still grieving her first love, a revolutionary who was killed by police.',
      'On her wedding night, she demands a divorce from her new, bewildered husband.',
      'He agrees, but they must live together for one year until the divorce is legalized.',
      'The film explores how their relationship slowly evolves from animosity to understanding during their cohabitation.'
    ]
  }
  ,
  {
    answer: 'KAAKA KAAKA',
    hints: [
      'A dedicated police officer heads a special unit to hunt down a feared criminal gang.',
      'The gang\'s leader, angered by the unit\'s success, begins to psychologically taunt the officer.',
      'The conflict turns intensely personal when the officer\'s wife is tragically murdered in an act of revenge.',
      'The film becomes a personal vendetta, as the grieving officer systematically dismantles the entire gang.',
      'A key theme is the extreme personal sacrifice required by those who protect society.'
    ]
  },
  {
    answer: 'GHAJINI',
    hints: [
      'A successful businessman is brutally attacked and suffers a severe head injury.',
      'The injury results in anterograde amnesia, preventing him from forming new memories for more than 15 minutes.',
      'He uses a system of polaroid photos, tattoos, and notes to himself to function.',
      'His entire existence is driven by a single goal: to find the man who murdered his fiancée during the attack.',
      'A medical student becomes entangled in his quest while trying to study his unique condition.'
    ]
  },
  {
    answer: 'VETTAIYAADU VILAIYAADU',
    hints: [
      'A high-ranking police officer from India travels to New York to investigate the murder of a colleague\'s daughter.',
      'He soon discovers the crime is not isolated but part of a pattern of brutal serial killings.',
      'The investigation reveals the killers are a pair, a man and a woman, who are on a gruesome spree.',
      'The pursuit becomes a global cat-and-mouse game, moving from the United States back to India.',
      'The film is a dark police procedural that delves into the psychological toll of hunting such monsters.'
    ]
  },
  {
    answer: 'SIVAJI: THE BOSS',
    hints: [
      'A wealthy software architect returns to his homeland with the goal of building free educational and medical institutions.',
      'His charitable efforts are completely blocked by a corrupt and powerful businessman who demands massive bribes.',
      'After being systematically stripped of his entire fortune, he is left with nothing.',
      'He decides to fight the corrupt system by using its own illegal methods, becoming a modern-day "Robin Hood."',
      'The film is a grand-scale entertainer about one man\'s war against systemic corruption.'
    ]
  },
  {
    answer: 'VAARANAM AAYIRAM',
    hints: [
      'The film is structured as a son\'s recollection of his father, triggered by the news of his father\'s death.',
      'It simultaneously narrates the son\'s life and the father\'s life in parallel, showing their shared experiences.',
      'Key events in the son\'s life include his first love, his subsequent descent into drug addiction, and his redemption.',
      'A central theme is the father\'s unwavering role as a friend and inspiration, guiding his son through every hardship.',
      'The son joins the military as a way to find discipline and recover from a personal tragedy.'
    ]
  },
  {
    answer: 'AAYIRATHIL ORUVAN',
    hints: [
      'An archaeological team embarks on a quest to find a missing researcher and a lost, mythical kingdom.',
      'They are forced to hire a group of reluctant porters, who are descendants of the kingdom, to guide them.',
      'Their journey through an uncharted jungle is filled with deadly traps, hostile environments, and savage tribes.',
      'They eventually discover the "lost" civilization, not as ruins, but as a living, breathing, and oppressed society.',
      'The film blends high-adventure with a strong political allegory about civilization, history, and power.'
    ]
  },
  {
    answer: 'THUPPAKKI',
    hints: [
      'An army captain, home on leave, witnesses a public bus explosion and captures the man responsible.',
      'He uncovers a plot that the bomber is part of a vast, secret network of terrorist "sleeper cells."',
      'Realizing the cells are planning a massive, coordinated attack, he goes rogue.',
      'He secretly re-activates his entire military unit to hunt down and neutralize the network\'s leader.',
      'The film is a high-octane race against time to stop the attack before the city is thrown into chaos.'
    ]
  },
  {
    answer: 'VIKRAM VEDHA',
    hints: [
      'A ruthless and clever gangster willingly surrenders to a tough, "by-the-book" police officer.',
      'While in custody, the gangster begins to narrate stories from his past.',
      'Each story presents a moral dilemma that blurs the line between right and wrong.',
      'The officer\'s black-and-white worldview is slowly eroded as he realizes the gangster\'s stories are all connected to his own life.',
      'The entire film is a philosophical battle of wits based on a famous folk tale.'
    ]
  },
  {
    answer: 'RATSASAN',
    hints: [
      'An aspiring filmmaker with a morbid fascination for serial killers is forced to join the police force.',
      'A series of gruesome and mysterious schoolgirl murders begins, baffling the department.',
      'The killer leaves a specific, taunting clue at each crime scene.',
      'The protagonist uses his rejected film research to profile the killer, but is ignored by his superiors.',
      'The case becomes terrifyingly personal when his own family is targeted by the seemingly inhuman antagonist.'
    ]
  },
  {
    answer: 'INDIAN',
    hints: [
      'An elderly freedom fighter, disgusted by modern-day corruption, becomes a vigilante.',
      'He uses an ancient and deadly martial art to execute officials he deems "traitors."',
      'A cat-and-mouse game ensues between the old vigilante and a young, corrupt official.',
      'A lengthy flashback reveals the vigilante\'s tragic past and his role in the fight for independence.',
      'The central conflict is a shocking one: the corrupt official being hunted is the vigilante\'s own son.'
    ]
  },
  {
    answer: 'ARINTHUM ARIYAMALUM',
    hints: [
      'A young man despises his estranged father, holding him responsible for his mother\'s death.',
      'He deliberately joins the crew of a powerful gangster, not realizing this man is his father.',
      'While in the gang, he is assigned to protect a young woman, unaware she is his own half-sister.',
      'The film explores his internal conflict as he slowly learns the truth about his father\'s past.',
      'His journey is one of accidental discovery and reconciliation with the very man he set out to hate.'
    ]
  },
  {
    answer: 'KARNAN',
    hints: [
      'The inhabitants of a remote, oppressed village are denied a bus stop by a neighboring, dominant village.',
      'This lack of a bus stop is a symbol of their systemic oppression and lack of a public identity.',
      'A rebellious, hot-headed young man from the village constantly fights back against the injustice.',
      'A brutal act of police violence pushes the entire village to unite and wage war against their oppressors.',
      'The film uses strong visual metaphors, including a headless deity and a donkey with bound legs, to represent their struggle.'
    ]
  },
  {
    answer: 'SARPATTA PARAMBARAI',
    hints: [
      'The story is set in the 1970s and revolves around two rival boxing clans in North Madras.',
      'A talented young boxer from the "underdog" clan is desperate for a chance to fight.',
      'He finally gets his shot at a prestigious match but is sidelined by internal clan politics.',
      'After falling into a life of crime and addiction, he must redeem himself and his clan\'s honor in the ring.',
      'The film is a detailed period drama about sports, deep-rooted rivalries, and personal redemption.'
    ]
  },
  {
    answer: 'SOORARAI POTTRU',
    hints: [
      'A man from a humble background dreams of starting a low-cost airline for ordinary people.',
      'He faces immense bureaucratic hurdles and sabotage from a powerful aviation tycoon.',
      'The story is a relentless chronicle of his struggle, fueled by a promise to his father.',
      'He is forced to innovate, from challenging government regulations to building his own aircraft.',
      'The film is a biographical drama about perseverance against a seemingly impossible system.'
    ]
  },
  {
    answer: 'PITHAMAGAN',
    hints: [
      'A man is raised in a graveyard, completely isolated from society, making him socially inept and animalistic.',
      'He is befriended by a charismatic, small-time con artist who gives him his first taste of human connection.',
      'The con artist is later brutally murdered by a ruthless drug lord.',
      'The socially-isolated protagonist embarks on a chilling and methodical quest for revenge.',
      'The film is a tragic tale of an unlikely friendship and the brutal retribution that follows.'
    ]
  },
  {
    answer: 'IMSAI ARASAN 23RD PULIKESI',
    hints: [
      'This film is a political satire set in a fictional pre-independence kingdom.',
      'The kingdom is ruled by a foolish, cruel, and cowardly king who is a puppet of foreign colonists.',
      'The king has a long-lost, intelligent, and patriotic twin brother who was raised as a commoner.',
      'Revolutionaries swap the twins, placing the intelligent brother on the throne to reform the kingdom.',
      'The comedy comes from the cowardly king\'s attempts to survive as a commoner and the new king\'s reforms.'
    ]
  },
  {
    answer: 'MAHAAN',
    hints: [
      'A man, raised in a strict, Gandhian family, abandons them to live a life of excess.',
      'He becomes a billionaire liquor baron, embracing the very things his father forbade.',
      'Years later, his estranged son re-enters his life as a fanatical police officer.',
      'The son is on a personal crusade to destroy his father\'s entire liquor empire.',
      'The film is a dramatic clash of ideologies between a "prodigal" father and a "puritanical" son.'
    ]
  },
  {
    answer: 'JAILER',
    hints: [
      'A retired, mild-mannered warden lives a quiet life with his family.',
      'His son, a scrupulous police officer, goes missing while investigating a smuggling ring.',
      'The father is forced to tap into his own hidden, violent past to find his son.',
      'His quest brings him face-to-face with a ruthless idol smuggler who controls a vast network.',
      'The film reveals the protagonist was once a legendary and feared figure, known for his brutal efficiency.'
    ]
  },
  {
    answer: 'VIKRAM',
    hints: [
      'A special ops commander leads a "black squad" to investigate a series of high-profile murders.',
      'The victims are all government officials, killed by a group of masked vigilantes.',
      'The investigation leads him to the head of a massive drug syndicate who is searching for a "missing" shipment.',
      'It is revealed that the "vigilante" leader is a ghost from the past, waging his own war against the drug lord.',
      'The film\'s events are a direct sequel to a previous story about a captured spy.'
    ]
  },
  {
    answer: 'MAANAADU',
    hints: [
      'A man, traveling to a wedding, finds himself inexplicably stuck in a time loop.',
      'He is forced to re-live the same day, which always ends with a political assassination.',
      'He discovers that a corrupt police officer is also stuck in the same loop.',
      'The hero and the villain are locked in a battle of wits, using their knowledge of the loop to outsmart each other.',
      'The protagonist must find a way to break the loop and prevent the assassination from happening.'
    ]
  },
  {
    answer: 'KO',
    hints: [
      'A photojournalist accidentally captures evidence of a political bombing.',
      'His investigation leads him to believe a corrupt, established politician is the villain.',
      'He actively helps a young, charismatic new politician win the election, believing him to be an honest alternative.',
      'The story centers on a major election and the power of media to influence it.',
      'The film\'s massive twist reveals the young, "idealistic" politician was the true mastermind behind the bombing.'
    ]
  },
  {
    answer: 'PAPANASAM',
    hints: [
      'A family man, who is an uneducated but movie-obsessed cable operator, lives a simple life.',
      'His family is pushed into a corner when his daughter accidentally kills a boy who was blackmailing her.',
      'The victim happens to be the son of the Inspector General of Police, leading to an intense investigation.',
      'The father uses plots and alibis learned from films he has watched to protect his family.',
      'He meticulously creates a "perfect day" scenario to prove his family was elsewhere when the crime happened.'
    ]
  },
  {
    answer: 'KANDUKONDAIN KANDUKONDAIN',
    hints: [
      'A mother and her daughters are forced to leave their ancestral mansion after their grandfather\'s will disinherits them.',
      'They move to a modest house in a village, forcing them to adapt to a new life.',
      'The film follows the romantic journeys of the two eldest daughters.',
      'One falls for an aspiring filmmaker, while the other is torn between a wounded ex-soldier and a businessman.',
      'The story is a well-known Indian adaptation of a classic 19th-century English novel.'
    ]
  },
  {
    answer: 'AYAN',
    hints: [
      'A young man, who works for a "good" smuggler, is an expert at evading customs at the airport.',
      'After his mentor is murdered, he begins to suspect a traitor within his own organization.',
      'He discovers his boss\'s son is secretly allied with a ruthless international drug lord.',
      'He decides to go undercover to dismantle the entire network from the inside.',
      'The film\'s climax involves a chase in a desert and a container of uncut diamonds.'
    ]
  },
  {
    answer: 'THEERAN ADHIGAARAM ONDRU',
    hints: [
      'This film is based on the real-life operations of a special police task force in the 1990s.',
      'A dedicated police officer uncovers a pattern in a series of extremely brutal highway robbery-murders.',
      'He realizes the crimes are not random but the work of a single, organized, and nomadic criminal tribe.',
      'The investigation spans multiple states and many years as he relentlessly hunts the gang.',
      'The film highlights the procedural difficulties of police work before modern technology.'
    ]
  },
  {
    answer: 'PADAYAPPA',
    hints: [
      'An engineer\'s family loses their entire fortune due to a relative\'s treachery.',
      'He must rebuild his life from scratch, starting as a manual laborer in a granite quarry.',
      'His primary antagonist is a woman whose obsessive, unrequited love for him turned into a decades-long quest for revenge.',
      'After 18 years, she returns as a wealthy matriarch to destroy his family.',
      'A famous scene involves a verbal confrontation around a decorative wooden swing (oonjal).' 
    ]
  },
  {
    answer: 'VISAARANAI',
    hints: [
      'Four laborers, who are immigrants in another state, are arrested on a false charge of robbery.',
      'They are subjected to brutal, systematic torture to force a confession.',
      'After being rescued and returned to their home state, they become witnesses to a high-level political cover-up.',
      'The very police system that was supposed to protect them now tries to silence them permanently.',
      'The film is a bleak and realistic critique of power, corruption, and police brutality.'
    ]
  },
  {
    answer: 'ARUNACHALAM',
    hints: [
      'A man from a respected village family learns a shocking secret about his birth after his father\'s death.',
      'His father\'s will presents him with an eccentric challenge: Spend 30 crores in 30 days.',
      'He must follow strict rules, including not giving the money away or owning any assets from it at the end.',
      'If he succeeds, he will inherit a much larger fortune (3000 crores).',
      'Greedy relatives try to sabotage his every attempt to spend the money according to the rules.'
    ]
  },
  {
    answer: 'KADHALUKKU MARIYADHAI',
    hints: [
      'Two students from different backgrounds fall in love, but keep their relationship a secret.',
      'The girl\'s family, particularly her brothers, are extremely protective and hostile to the relationship.',
      'The couple decides to elope, causing immense pain to both their families.',
      'While waiting to get married, they both have a change of heart, realizing their families\' honor is more important.',
      'Their mutual decision to sacrifice their love ultimately earns them their families\' respect and approval.'
    ]
  },
  {
    answer: 'SIVAKASI',
    hints: [
      'A good-natured businessman in the city is known for his short temper against injustice.',
      'He is haunted by his past and travels to his home village with the sole purpose of stopping his sister\'s wedding.',
      'A flashback reveals he was framed for a crime by his own malicious elder brother.',
      'This betrayal led to him being disowned and the tragic death of his parents.',
      'He must expose his brother\'s treachery to his sister before she marries the wrong man.'
    ]
  },
  {
    answer: 'AADUKALAM',
    hints: [
      'This film is set in the world of high-stakes, illegal rooster fighting in a southern city.',
      'A star protégé in a respected fighting clan earns the envy of his own mentor.',
      'The mentor, feeling overshadowed, plots to humiliate his student using deceit and betrayal.',
      'A cross-clan romance further complicates the bitter rivalry.',
      'The story is a raw depiction of friendship, honor, and betrayal within a competitive subculture.'
    ]
  },
  {
    answer: 'POLLADHAVAN',
    hints: [
      'A young, middle-class man\'s life revolves around his prized, newly-purchased motorcycle.',
      'The motorcycle is stolen, and his desperate search for it pulls him into the city\'s criminal underworld.',
      'He discovers his bike is now being used by a ruthless smuggling and extortion gang.',
      'The film becomes a violent battle as he tries to reclaim his single most valuable possession.',
      'The title translates to "The Unruly Man."'
    ]
  },
  {
    answer: 'VINNAITHAANDI VARUVAAYAA',
    hints: [
      'An aspiring filmmaker, who is Hindu, falls in love with a woman from a strict, traditional Christian family.',
      'The film is a realistic portrayal of their long-distance relationship and the conflicts that arise.',
      'Her family is strictly against their union, forcing her to choose between love and family.',
      'They struggle with their professional ambitions (his filmmaking, her studies) and their personal feelings.',
      'The film is known for its ambiguous, bittersweet ending that breaks from romantic conventions.'
    ]
  },
  {
    answer: 'SUPER DELUXE',
    hints: [
      'This film is an anthology of four seemingly separate, bizarre stories.',
      'One story involves a young boy who discovers his estranged father has returned as a transgender woman.',
      'Another follows an unfaithful wife who must hide the body of her lover who died mid-coitus.',
      'A group of teenagers\' attempt to watch an adult film leads them to a life-or-death situation.',
      'All the characters\' lives are shown to be mysteriously interconnected by a common, cosmic event.'
    ]
  },
  {
    answer: 'PIZZA',
    hints: [
      'A pizza delivery boy\'s late-night delivery to a mysterious, dark bungalow turns into a nightmare.',
      'He experiences a series of terrifying, seemingly supernatural events inside the house.',
      'He returns to the pizza shop in a state of shock, recounting his paranormal ordeal.',
      'His boss and colleagues are skeptical, and the story begins to unravel.',
      'The final, massive twist reveals a complex, human plot and that nothing supernatural occurred at all.'
    ]
  },
  {
    answer: 'RAAVANAN',
    hints: [
      'A police officer\'s wife is abducted by a tribal leader and taken deep into a dense jungle.',
      'The abductor is seen as a hero by his people but a terrorist by the law.',
      'The film explores the abductor\'s motives, which are rooted in revenge for a brutal police atrocity against his sister.',
      'While in captivity, the wife begins to understand her captor\'s perspective and her husband\'s role in the injustice.',
      'The story is a modern-day re-imagining of an epic, told from the "villain\'s" point of view.'
    ]
  },
  {
    answer: 'THEGIDI',
    hints: [
      'A young man is hired by a private detective agency.',
      'His job is to shadow individuals and create detailed reports on their lives.',
      'He soon realizes that every person whose case he has "closed" has died under mysterious circumstances.',
      'Fearing for his own life and the life of his latest subject, he begins to investigate his own employers.',
      'The plot uncovers a massive, deadly insurance scam.'
    ]
  },
  {
    answer: 'MAANAGARAM',
    hints: [
      'This is a hyperlink film where the lives of several strangers intersect in a large, chaotic city.',
      'A young man moves to the city for a new job, only to be mugged and have his documents stolen.',
      'A hot-headed youth works as a driver for a local gangster.',
      'A cab driver finds himself in possession of a kidnapped child.',
      'All their stories collide violently over one night, forcing them to unite against a common enemy.'
    ]
  },
  {
    answer: 'KATTRADHU THAMIZH',
    hints: [
      'A brilliant, post-graduate student in literature struggles to find a job in a society that doesn\'t value his education.',
      'He is deeply in love with a childhood friend, who is his only anchor in life.',
      'The film charts his psychological decline as he is pushed to the brink by societal apathy and poverty.',
      'He becomes a fugitive after a violent outburst, and the film is structured as his confession.',
      'The story is a bleak commentary on the state of education and the value of art in modern society.'
    ]
  },
  {
    answer: 'KAADHAL KONDEN',
    hints: [
      'A college student, raised in an orphanage, is socially isolated and brilliant.',
      'He develops an intense, obsessive affection for a female classmate who shows him kindness.',
      'His affection turns violent when he believes his best friend is "stealing" her from him.',
      'The film is a dark psychological thriller exploring the effects of a traumatic and loveless childhood.',
      'A key plot point involves the protagonist trapping the girl and his friend in a remote house.'
    ]
  }
  ,
  {
    answer: 'RAMANAA',
    hints: [
      'A college professor leads a double life, secretly running a citizen-led vigilante network.',
      'This network, comprised of his former students, identifies and executes the 15 most corrupt officials each month.',
      'The film is a cat-and-mouse game between this mysterious vigilante leader and a team of police officers.',
      'A lengthy flashback reveals his crusade began after his pregnant wife and daughter were killed in a hospital collapse.',
      'The hospital\'s collapse was due to corruption, and all the officials responsible were acquitted.'
    ]
  },
  {
    answer: 'NANBAN',
    hints: [
      'Two friends embark on a road trip, with a third in tow, to find their long-lost college roommate.',
      'Flashbacks reveal their college days, where their friend challenged the rigid, high-pressure education system.',
      'He constantly clashed with their tyrannical principal, inspiring his friends to follow their true passions over high-paying jobs.',
      'He disappears after graduation, and his friends\' search for him leads to a major, unexpected revelation.',
      'A key scene involves the friends using an improvised vacuum device to deliver a baby during a storm.'
    ]
  },
  {
    answer: 'VAALI',
    hints: [
      'A man, who is deaf and mute, has an identical twin brother who can speak.',
      'The speaking twin falls in love with and marries a woman, bringing her home.',
      'The deaf-mute twin develops a dark, secret, and violent obsession with his new sister-in-law.',
      'He begins to secretly impersonate his brother in an attempt to get close to her.',
      'The wife must eventually figure out which of the identical twins is her husband and which is the predator.'
    ]
  },
  {
    answer: 'PAIYAA',
    hints: [
      'A young, jobless man in one city offers a ride to a woman he is attracted to.',
      'He quickly learns she is not on a casual trip, but is running away from a forced, dangerous arranged marriage.',
      'The film becomes a high-speed road trip as they are pursued by the woman\'s violent family.',
      'A second group of gangsters also begins to chase them, revealing a hidden, violent past belonging to the protagonist.',
      'The entire story unfolds on the highway journey between two major South Indian cities.'
    ]
  },
  {
    answer: 'RAJA RANI',
    hints: [
      'A man and woman, forced into an arranged marriage, despise each other from the first night.',
      'They live as hostile roommates, constantly bickering and making each other\'s lives miserable.',
      'Parallel flashbacks reveal the source of their bitterness: both are grieving tragic, failed first loves.',
      'One lost their partner in a sudden, shocking accident; the other was painfully rejected at the altar.',
      'The film charts their journey from mutual hatred to understanding their shared pain, and finally, to falling in love.'
    ]
  },
  {
    answer: 'M KUMARAN SON OF MAHALAKSHMI',
    hints: [
      'A young kick-boxer\'s entire world revolves around his single mother, who raised him alone.',
      'After his mother\'s sudden death, he must travel to another country to meet his estranged father for the first time.',
      'He is shocked to discover his father is a famous, disgraced former kick-boxing champion.',
      'The father and son must overcome 20 years of resentment and abandonment.',
      'The climax involves the son fighting his father\'s greatest rival in a national championship.'
    ]
  },
  {
    answer: 'BOMBAY',
    hints: [
      'A Hindu man and a Muslim woman from the same village fall in love.',
      'Their families violently oppose the inter-religious relationship, forcing them to elope to a major city.',
      'They get married, build a new life, and have twin sons.',
      'Their peaceful existence is shattered by the outbreak of massive, real-life religious riots in the city.',
      'In the chaos, their children are lost, forcing the couple to search for them in the burning, war-torn streets.'
    ]
  },
  {
    answer: 'UNNAIPOL ORUVAN',
    hints: [
      'An "ordinary man" calls the police commissioner, stating he has planted five bombs across the city.',
      'He demands the immediate release of four specific, known terrorists.',
      'The entire film unfolds in real-time as the police department scrambles to locate the caller and find the bombs.',
      'The caller systematically outsmarts the police and the government\'s top negotiator.',
      'The final twist reveals the caller is not a terrorist, but a "stupid common man" seeking his own form of vigilante justice.'
    ]
  },
  {
    answer: 'SANTHOSH SUBRAMANIAM',
    hints: [
      'A young man\'s entire life is micromanaged by his wealthy, controlling father.',
      'The father even selects a "perfect" bride for him from another wealthy family.',
      'The son, however, falls in love with a boisterous, independent woman from a middle-class background.',
      'To win his father\'s approval, the woman agrees to live in their "perfect" family home for one week.',
      'The film\'s conflict is the clash between her vibrant personality and the father\'s rigid, joyless household rules.'
    ]
  },
  {
    answer: 'AADHAVAN',
    hints: [
      'A highly-skilled assassin is hired to kill a respected magistrate.',
      'His multiple, elaborate attempts to carry out the assassination all fail due to comically bad luck.',
      'To get close to his target, he infiltrates the magistrate\'s large joint family, posing as a long-lost relative.',
      'While living in the house, he begins to grow fond of the family and uncovers a separate, internal conspiracy.',
      'He ultimately must protect the very man he was originally sent to kill.'
    ]
  }
  ,
  {
    answer: 'THALAPATHI',
    hints: [
      'This film is a modern adaptation of a key friendship/rivalry from the epic Mahabharata.',
      'A man, abandoned by his mother on a train, grows up to be the loyal enforcer for a kind-hearted underworld leader.',
      'His biological mother re-enters his life, bringing with her a terrible secret.',
      'He is forced into a direct conflict with the new, righteous district collector.',
      'The central dilemma is his unwavering loyalty to his friend versus his newly discovered (and unknown) family ties.'
    ]
  },
  {
    answer: 'GENTLEMAN',
    hints: [
      'By day, the protagonist is a respected community figure who runs a popular homemade snack business.',
      'By night, he leads a double life as a high-tech thief, systematically robbing corrupt public officials.',
      'He uses all the stolen black money to build and fund a massive, free educational institution.',
      'A lengthy flashback reveals his actions are driven by a personal tragedy involving the "donation" system in medical colleges.',
      'The film\'s title refers to a man of high character.'
    ]
  },
  {
    answer: 'KAADHAL',
    hints: [
      'A poor, working-class mechanic falls in love with a wealthy high school student.',
      'The couple, anticipating her family\'s violent disapproval, decides to elope to a new city.',
      'Her family tracks them down and, in a brutal act of vengeance, severely beats the boy.',
      'The assault leaves the boy with permanent, catastrophic brain damage.',
      'The film\'s tragic epilogue shows the girl, now married, encountering her former lover, who is now a mentally shattered beggar.'
    ]
  },
  {
    answer: 'I',
    hints: [
      'A champion bodybuilder\'s life and career are ruined by a group of jealous rivals.',
      'His enemies, including another model and a doctor, inject him with a virus that causes grotesque physical deformities.',
      'He is transformed from a muscle-bound hero into a hunchbacked recluse, and he is presumed dead.',
      'He uses his new, unrecognizable appearance to exact a series of elaborate, poetic, and horrific revenges.',
      'A key plot point involves him using bees, fire, and induced "hairy" and "bald" afflictions on his tormentors.'
    ]
  },
  {
    answer: 'SUBRAMANIAPURAM',
    hints: [
      'This film is a gritty period piece set in a southern city during the 1980s.',
      'A group of aimless young friends gets entangled in the violent rivalry between two local politicians.',
      'They commit a murder on behalf of one politician, expecting protection and a bright future in return.',
      'They are instead betrayed, imprisoned, and forced to fight for their lives against their former employer.',
      'The story is a bleak chronicle of how friendship and loyalty are systematically destroyed by politics.'
    ]
  },
  {
    answer: 'MERSAL',
    hints: [
      'A doctor who offers free treatment and a magician who performs grand illusions are implicated in a series of abductions.',
      'All the victims are corrupt officials within the medical industry.',
      'It is revealed that the doctor and magician are identical brothers on a mission of revenge.',
      'A flashback details how a greedy medical tycoon murdered their father to steal his community hospital.',
      'The film is a social commentary on corruption in the national healthcare system.'
    ]
  },
  {
    answer: 'APOORVA SAGODHARARGAL',
    hints: [
      'After their father is murdered by four criminals, a pregnant woman gives birth to identical twins.',
      'One twin is born a dwarf; the other is of normal height. They are separated at birth.',
      'The dwarf brother grows up in a circus and discovers the truth of his father\'s death.',
      'He uses his unique size and intelligence to hunt down and kill the four murderers, baffling the police.',
      'The normal-sized brother, a mechanic, becomes the prime suspect in the "accidental" deaths.'
    ]
  },
  {
    answer: 'KATHI',
    hints: [
      'A brilliant, petty thief escapes from prison and switches places with his identical lookalike.',
      'He discovers his double is a quiet social activist who was leading a massive hunger strike.',
      'The activist was fighting to save his village\'s farmland and water from a powerful corporation.',
      'The thief, moved by the villagers\' plight, uses his criminal cunning to take up their cause.',
      'A famous scene involves him explaining corporate water theft to the media using a "coin" analogy.'
    ]
  },
  {
    answer: 'O KADHAL KANMANI',
    hints: [
      'A young man and woman, both skeptical of marriage, decide to enter a modern live-in relationship.',
      'They rent a room from an elderly, traditional couple who have been married for decades.',
      'The film explores the contrast between the young couple\'s casual, commitment-free love and their landlords\' deep, lifelong bond.',
      'Their relationship is tested when their respective careers threaten to pull them to different continents.',
      'The film\'s central conflict is their internal debate over love versus ambition.'
    ]
  },
  {
    answer: 'PETTA',
    hints: [
      'A charismatic man takes a job as a college hostel warden and brings the unruly students under control.',
      'His actions put him in conflict with a dangerous local goon and his powerful political father.',
      'A long flashback reveals the warden is not who he claims to be.',
      'He was once a beloved village leader whose entire family was massacred by this same politician.',
      'His job at the hostel was just the first, calculated step in an elaborate, long-game of revenge.'
    ]
  }
];

export default puzzles;