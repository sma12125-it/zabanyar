const LESSONS=[];
function L(level,icon,title,scene,partner,dlg,chunks,notes,sounds,quiz){
 const sp=s=>s.trim().split("\n").map(x=>x.split("|").map(y=>y.trim()));
 LESSONS.push({id:LESSONS.length+1,level,icon,title,scene,partner,
  dialogue:sp(dlg).map(([s,en,fa])=>({me:s=="B",en,fa})),
  chunks:sp(chunks).map(([en,fa])=>({en,fa})),
  notes:sp(notes).map(([book,casual,fa])=>({book,casual,fa})),
  sounds:sp(sounds).map(([w,how,fa])=>({w,how,fa})),
  quiz:sp(quiz).map(([q,o,a])=>({q,o:o.split(";").filter(Boolean),a:+a}))});
}
L("A1","👋","سلام و احوال‌پرسی خودمونی","در یک مهمانی با کسی آشنا می‌شوید.","Jake",`
A|Hey! I'm Jake. What's your name?|سلام! من جیک‌ام. اسمت چیه؟
B|Hi, I'm Sara. Nice to meet you.|سلام، من سارا هستم. از آشنایی‌ات خوشحالم.
A|Nice to meet you too. So, where are you from?|منم همین‌طور. خب، اهل کجایی؟
B|I'm from Tehran. How about you?|اهل تهرانم. تو چی؟
A|I'm from Chicago. How do you know Emma?|من اهل شیکاگوام. اِما رو از کجا می‌شناسی؟
B|We work together. What about you?|با هم کار می‌کنیم. تو چی؟
A|Oh, we went to college together. Cool!|آهان، با هم دانشگاه می‌رفتیم. چه جالب!
B|Yeah, small world!|آره، دنیا کوچیکه!`,`
Hey!|سلام! (خودمونی)
What's your name?|اسمت چیه؟
Nice to meet you.|از آشنایی‌ات خوشحالم.
Nice to meet you too.|من هم همین‌طور.
Where are you from?|اهل کجایی؟
How about you?|تو چی؟
What about you?|تو چطور؟
How do you know...?|... رو از کجا می‌شناسی؟
We work together.|همکاریم.
Small world!|دنیا کوچیکه!
Cool!|عالیه! / چه باحال!`,`
Hello, how do you do?|Hey, how's it going?|«How do you do» تقریباً منسوخ است؛ بومی‌ها می‌گویند how's it going.
I am from Iran.|I'm from Iran.|در گفتار تقریباً همیشه شکل کوتاه (I'm) به کار می‌رود.
What is your name?|What's your name?|What is را در محاوره «واتس» می‌گویند.`,`
Nice to meet you|نایس تو میچو|t و y به هم می‌چسبند و «چ» می‌شوند.
What's your name?|واتس یِر نِیم|your در جمله ضعیف و «یِر» تلفظ می‌شود.`,`
جیک اهل کجاست؟|Tehran;Chicago;London|1
سارا اِما را از کجا می‌شناسد؟|از دانشگاه;از کار;همسایه‌اند|1`);

L("A1","☕","سفارش قهوه","در کافی‌شاپ قهوه سفارش می‌دهید.","Barista",`
A|Hi there! What can I get you?|سلام! چی میل دارید؟
B|Can I get a medium latte, please?|یه لاته‌ی متوسط لطفاً.
A|Sure. Hot or iced?|حتماً. گرم یا سرد؟
B|Iced, please. With oat milk.|سرد لطفاً. با شیر جو دوسر.
A|Anything else?|چیز دیگه‌ای هم می‌خواید؟
B|No, that's it, thanks.|نه، همین، ممنون.
A|For here or to go?|اینجا میل می‌کنید یا می‌برید؟
B|To go, please. Can I pay by card?|می‌برم. می‌تونم با کارت حساب کنم؟
A|Of course. Just tap here.|البته. فقط کارت رو اینجا بزنید.`,`
What can I get you?|چی براتون بیارم؟
Can I get...?|می‌شه یه ... بدید؟
..., please.|...، لطفاً.
Hot or iced?|گرم یا سرد؟
Anything else?|چیز دیگه‌ای؟
That's it.|همین.
That's all, thanks.|همش همینه، ممنون.
For here or to go?|اینجا یا بیرون‌بر؟
To go.|بیرون‌بر.
Can I pay by card?|با کارت حساب کنم؟
Just tap here.|کارت رو اینجا بزنید.
I'll have...|من ... می‌خورم/برمی‌دارم.`,`
I would like to order a coffee.|Can I get a coffee?|«Can I get» در کافه‌های آمریکا کاملاً طبیعی و مؤدبانه است.
I want a latte.|I'll have a latte, please.|«I want» کمی تند به نظر می‌رسد؛ I'll have بهتر است.
Take away (UK) / To go (US)|To go?|در انگلیس take away و در آمریکا to go.`,`
Can I get a|کِنای گِدِه|can ضعیف می‌شود و t در get شبیه d نرم (آمریکایی).
What can I get you?|واکِنای گِچو|t+you = «چو».`,`
مشتری چه شیری می‌خواهد؟|شیر معمولی;شیر جو دوسر;بدون شیر;|1
مشتری قهوه را کجا می‌خورد؟|اینجا;می‌برد;نمی‌خرد|1`);

L("A1","📱","پیام دادن (Texting)","با دوستتان چت می‌کنید.","Mia",`
A|hey u up?|هی بیداری؟
B|yeah what's up?|آره، چه خبر؟
A|wanna grab lunch tmrw?|فردا بریم یه ناهار بزنیم؟
B|sure! what time?|حتماً! چه ساعتی؟
A|idk like 1?|نمی‌دونم، حدود یک؟
B|sounds good. where?|خوبه. کجا؟
A|that taco place downtown|اون تاکوفروشیه مرکز شهر.
B|omg yes, love that place. see u there!|وای آره، عاشق اونجام. اونجا می‌بینمت!
A|lol ok cya|باشه، فعلاً!`,`
u up?|بیداری؟ (پیامکی)
what's up?|چه خبر؟
wanna = want to|می‌خوای
grab lunch|یه ناهار سرسری خوردن
tmrw = tomorrow|فردا
idk = I don't know|نمی‌دونم
like 1|حدوداً ساعت یک
sounds good|خوبه، اوکیه
omg = oh my god|وای!
lol = laughing out loud|خنده (برای لحن دوستانه)
cya = see you|می‌بینمت، فعلاً
brb = be right back|الان برمی‌گردم
np = no problem|مشکلی نیست
ttyl = talk to you later|بعداً حرف می‌زنیم`,`
Would you like to have lunch with me tomorrow?|wanna grab lunch tmrw?|در چت، کوتاه‌نویسی و حروف کوچک کاملاً عادی است.
I do not know.|idk|اختصارها فقط برای چت؛ در ایمیل کاری ننویسید.
That is a good idea.|sounds good|sounds good جواب استاندارد موافقت است.`,`
wanna|وانا|want to در گفتار سریع «وانا» می‌شود.
see you|سی‌یا|you در خداحافظی «یا» تلفظ می‌شود.`,`
قرار ناهار چه ساعتی است؟|حدود یک;ساعت دوازده;شب|0
کجا می‌روند؟|پیتزافروشی;تاکوفروشی مرکز شهر;خانه‌ی میا|1`);

L("A1","🛒","خرید از فروشگاه","در فروشگاه دنبال چیزی می‌گردید.","Clerk",`
A|Hey, can I help you find anything?|سلام، کمک می‌خواید چیزی پیدا کنید؟
B|Yeah, where can I find the milk?|آره، شیر کجاست؟
A|It's in aisle five, on the left.|راهروی پنج، سمت چپ.
B|Thanks. And do you have any bags?|ممنون. کیسه هم دارید؟
A|Yep, they're ten cents each.|آره، هرکدوم ده سنت.
B|Okay, I'll take one.|باشه، یکی برمی‌دارم.
A|Your total is twelve fifty.|جمعش می‌شه دوازده و پنجاه.
B|Here you go.|بفرمایید.
A|Thanks! Have a good one.|ممنون! روز خوبی داشته باشید.
B|You too!|همچنین!`,`
Can I help you find anything?|کمک لازم دارید؟
I'm just looking.|فقط دارم نگاه می‌کنم.
Where can I find...?|... کجاست؟
It's in aisle five.|توی راهروی پنجه.
on the left / on the right|سمت چپ / سمت راست
Do you have any...?|... دارید؟
I'll take one.|یکی برمی‌دارم.
Your total is...|جمعش می‌شه...
Here you go.|بفرمایید.
Have a good one.|روز خوبی داشته باشید.
You too!|همچنین!
How much is this?|این چنده؟`,`
Excuse me, where is the milk located?|Where's the milk?|خیلی رسمی صحبت کردن در فروشگاه عجیب است.
Have a nice day.|Have a good one.|Have a good one بسیار رایج و خودمونی است.
Here it is.|Here you go.|وقتی چیزی به کسی می‌دهید: Here you go.`,`
twelve fifty|توِلو فیفتی|قیمت‌ها را بدون dollars و cents می‌گویند.
Have a good one|هَوِه گودوان|کلمات به هم وصل می‌شوند.`,`
شیر کجاست؟|راهروی پنج سمت چپ;راهروی دو;پشت صندوق|0
قیمت هر کیسه چقدر است؟|رایگان;ده سنت;یک دلار|1`);

L("A1","🙋","حال و احوال روزانه","همکارتان را صبح می‌بینید.","Tom",`
A|Morning! How's it going?|صبح بخیر! چطوری؟
B|Pretty good, thanks. You?|خوبم، مرسی. تو؟
A|Not bad. Kinda tired, though.|بد نیستم. یه‌کم خسته‌ام البته.
B|Oh no, rough night?|ای وای، شب سختی بود؟
A|Yeah, my baby kept me up.|آره، بچه‌م نذاشت بخوابم.
B|Aw, I'm sorry. Coffee?|آخی، متأسفم. قهوه؟
A|Oh my god, yes please.|وای آره، لطفاً.
B|Let's go. My treat.|بریم. مهمون من.`,`
Morning!|صبح بخیر! (کوتاه‌شده)
How's it going?|چطوری؟ / اوضاع چطوره؟
Pretty good.|نسبتاً خوب.
Not bad.|بد نیستم.
Kinda tired.|یه‌کم خسته.
..., though.|... البته / ولی
Rough night?|شب بدی بود؟
kept me up|نذاشت بخوابم
I'm sorry.|متأسفم. / ناراحت شدم.
My treat.|مهمون من.
Same old, same old.|همون همیشگی.
Can't complain.|بد نیست، شکایتی ندارم.`,`
I am fine, thank you. And you?|Pretty good, you?|«I'm fine thank you and you» کتابی و رباتیک به نظر می‌رسد.
I am a little tired.|I'm kinda tired.|kinda = kind of = یه‌کم.
I will pay.|My treat. / It's on me.|برای مهمان کردن کسی.`,`
How's it going?|هاوزِت گوئین|ing در گفتار اغلب «این» تلفظ می‌شود.
kinda|کایندا|kind of → kinda.`,`
چرا تام خسته است؟|کار زیاد;بچه‌اش نگذاشت بخوابد;مریض بود|1
چه کسی پول قهوه را می‌دهد؟|تام;گوینده‌ی دوم (شما);هیچ‌کس|1`);

L("A1","🧭","پرسیدن آدرس","در خیابان گم شده‌اید.","Stranger",`
B|Excuse me, sorry. Is there a subway station near here?|ببخشید. این نزدیکی ایستگاه مترو هست؟
A|Yeah, there's one on Fifth Street.|آره، یکی توی خیابون پنجم هست.
B|How do I get there?|چطور برم اونجا؟
A|Go straight, then take a right at the lights.|مستقیم برو، بعد سر چراغ بپیچ راست.
B|Is it far?|دوره؟
A|Nah, it's like a five-minute walk.|نه، حدود پنج دقیقه پیاده‌روئه.
B|Awesome, thanks so much!|عالیه، خیلی ممنون!
A|No worries.|خواهش می‌کنم.`,`
Excuse me, sorry.|ببخشید (برای جلب توجه)
Is there a ... near here?|این نزدیکی ... هست؟
How do I get there?|چطوری برم اونجا؟
Go straight.|مستقیم برو.
take a right / take a left|بپیچ راست / بپیچ چپ
at the lights|سر چراغ‌راهنما
Is it far?|دوره؟
Nah.|نه (خودمونی)
a five-minute walk|پنج دقیقه پیاده
Thanks so much!|خیلی ممنون!
No worries.|خواهش می‌کنم / مشکلی نیست.
You can't miss it.|حتماً می‌بینیدش.`,`
Turn to the right.|Take a right.|take a right طبیعی‌تر است.
You are welcome.|No worries. / No problem.|No worries در استرالیا و انگلیس و آمریکا رایج است.
No.|Nah.|Nah فقط در محاوره‌ی دوستانه.`,`
take a right|تِیکِه رایت|take و a به هم می‌چسبند.
Is it far?|ایزِت فار|it ضعیف می‌شود.`,`
ایستگاه در کدام خیابان است؟|خیابان پنجم;خیابان اصلی;خیابان دوم|0
چقدر راه است؟|پنج دقیقه پیاده;یک ساعت;باید تاکسی بگیرد|0`);
L("A2","📅","برنامه‌ریزی آخر هفته","با دوستتان برای آخر هفته قرار می‌گذارید.","Chris",`
A|Hey, you got any plans this weekend?|هی، آخر هفته برنامه‌ای داری؟
B|Not really. What's up?|نه زیاد. چطور؟
A|A few of us are gonna check out that new burger place Saturday. Wanna come?|چندتامون شنبه می‌خوایم بریم اون همبرگری جدیده رو امتحان کنیم. میای؟
B|I'd love to! What time are you guys going?|خیلی دوست دارم! ساعت چند می‌رید؟
A|Probably around seven. I can pick you up if you want.|احتمالاً حدود هفت. اگه بخوای میام دنبالت.
B|That'd be great. Should I bring anything?|عالی می‌شه. چیزی بیارم؟
A|Nah, just yourself.|نه، فقط خودت بیا.
B|Cool. Let me know if anything changes.|باشه. اگه چیزی عوض شد خبرم کن.
A|Will do. See ya Saturday!|حتماً. شنبه می‌بینمت!`,`
Got any plans this weekend?|آخر هفته برنامه داری؟
Not really.|نه زیاد / نه چندان.
What's up?|چطور؟ چی شده؟
gonna = going to|می‌خوایم، قراره
check out|سر زدن، امتحان کردن (جای جدید)
Wanna come?|میای؟
I'd love to!|با کمال میل!
you guys|شماها (خودمونی، برای همه)
pick you up|اومدن دنبالت
That'd be great.|عالی می‌شه.
Should I bring anything?|چیزی بیارم؟
Just yourself.|فقط خودت بیا.
Let me know.|خبرم کن.
Will do.|حتماً، انجام می‌دم.
I'm down.|پایه‌ام.
Count me in.|منم هستم.`,`
Do you have any plans?|You got any plans?|در محاوره‌ی آمریکایی do حذف می‌شود.
We are going to visit...|We're gonna check out...|gonna فقط در گفتار؛ در نوشتار رسمی نه.
Yes, I will come.|I'm down! / Count me in!|برای اعلام پایه بودن.`,`
gonna|گانا|going to → gonna.
Let me know|لِمی نو|t حذف می‌شود: lemme.`,`
کی و کجا می‌روند؟|جمعه سینما;شنبه همبرگری;یکشنبه پارک|1
کریس چه پیشنهادی می‌دهد؟|پول غذا را بدهد;دنبال شما بیاید;غذا بیاورد|1`);

L("A2","🍽️","رستوران","در رستوران غذا سفارش می‌دهید.","Server",`
A|Hi guys, can I start you off with something to drink?|سلام، اول نوشیدنی چی میل دارید؟
B|Just water for now, thanks.|فعلاً فقط آب، ممنون.
A|Sure thing. Are you ready to order, or do you need a minute?|حتماً. آماده‌ی سفارشید یا یه دقیقه وقت می‌خواید؟
B|I think we're ready. What do you recommend?|فکر کنم آماده‌ایم. چی پیشنهاد می‌کنید؟
A|The salmon's really popular. It's my favorite.|ماهی سالمون خیلی طرفدار داره. مورد علاقه‌ی خودمه.
B|Okay, I'll go with that. Does it come with a side?|باشه، همون رو می‌گیرم. مخلفات داره؟
A|Yep, fries or salad.|آره، سیب‌زمینی یا سالاد.
B|Salad, please. Oh, and can I get the dressing on the side?|سالاد لطفاً. راستی، سس رو جدا بیارید؟
A|No problem.|حتماً.
B|Could we get the check, please?|صورتحساب رو می‌آرید لطفاً؟`,`
start you off with|اول براتون ... بیارم
for now|فعلاً
Sure thing.|حتماً.
Are you ready to order?|آماده‌ی سفارشید؟
I need a minute.|یه دقیقه وقت می‌خوام.
What do you recommend?|چی پیشنهاد می‌کنید؟
I'll go with...|... رو انتخاب می‌کنم.
Does it come with...?|... همراهش هست؟
a side|مخلفات / غذای جانبی
on the side|جدا (کنار بشقاب)
Could we get the check?|صورتحساب رو بیارید؟ (US)
Can we get the bill?|صورتحساب لطفاً (UK)
I'm allergic to...|به ... حساسیت دارم.
Can I get this to go?|می‌شه اینو برام بپیچید؟
It's on me.|حساب با من.`,`
Please bring me the bill.|Could we get the check?|check آمریکایی، bill انگلیسی.
I choose the salmon.|I'll go with the salmon.|go with برای انتخاب کردن.
Can you pack it?|Can I get a box?|برای بردن باقی غذا.`,`
Could we|کودوی|Could و we پیوسته.
salmon|سَمِن|حرف l تلفظ نمی‌شود!`,`
گارسون چه غذایی پیشنهاد می‌دهد؟|استیک;ماهی سالمون;پاستا|1
مشتری مخلفات را چه می‌خواهد؟|سیب‌زمینی;سالاد;هیچ|1`);

L("A2","📞","تماس تلفنی و وقت گرفتن","برای دندانپزشکی وقت می‌گیرید.","Receptionist",`
A|Bright Smile Dental, this is Amy speaking. How can I help you?|دندانپزشکی برایت اسمایل، ایمی هستم. چه کمکی می‌تونم بکنم؟
B|Hi, I'd like to make an appointment for a checkup.|سلام، می‌خواستم برای معاینه وقت بگیرم.
A|Sure. Have you been here before?|حتماً. قبلاً اینجا اومدید؟
B|No, it's my first time.|نه، بار اولمه.
A|No problem. How's next Tuesday at 10?|مشکلی نیست. سه‌شنبه‌ی آینده ساعت ده چطوره؟
B|Hmm, Tuesday doesn't really work for me. Do you have anything on Thursday?|اوم، سه‌شنبه برام جور نیست. پنجشنبه وقتی دارید؟
A|Let me check... I've got 2:30 on Thursday.|بذارید ببینم... پنجشنبه ساعت دو و نیم دارم.
B|Perfect, I'll take it.|عالیه، همونو می‌گیرم.
A|Great. Can I get your name and number?|عالیه. اسم و شماره‌تون رو می‌دید؟
B|Sure, it's Ali Rezaei. Sorry, could you hold on a sec?|حتماً، علی رضایی. ببخشید، یه لحظه گوشی دستتون باشه؟`,`
This is ... speaking.|... هستم (پشت تلفن)
How can I help you?|چه کمکی از دستم برمیاد؟
I'd like to make an appointment.|می‌خوام وقت بگیرم.
Have you been here before?|قبلاً اومدید؟
It's my first time.|بار اولمه.
How's ... ?|... چطوره؟
That doesn't work for me.|برام جور نیست.
Do you have anything on...?|... وقت خالی دارید؟
Let me check.|بذارید چک کنم.
I'll take it.|همونو می‌گیرم.
Hold on a sec.|یه لحظه صبر کنید.
Could you repeat that?|می‌شه تکرار کنید؟
You're breaking up.|صداتون قطع و وصل می‌شه.
I'll call you back.|بهتون زنگ می‌زنم.
Who's calling, please?|شما؟ (پشت تلفن)`,`
I am Ali.|This is Ali.|پشت تلفن می‌گویند This is ...، نه I am.
That time is not suitable for me.|That doesn't work for me.|work for me = برایم مناسب است.
Wait a moment please.|Hold on a sec.|sec = second.`,`
I'd like to|آیدلایک تو|I would → I'd.
Hold on a sec|هُلدان اِ سِک|d و o به هم وصل می‌شوند.`,`
نوبت نهایی کی است؟|سه‌شنبه ساعت ده;پنجشنبه دو و نیم;جمعه صبح|1
آیا بیمار قبلاً آنجا رفته؟|بله;نه، بار اول است;معلوم نیست|1`);

L("A2","🏨","هتل و پذیرش","در هتل پذیرش می‌شوید و مشکلی دارید.","Front desk",`
B|Hi, I have a reservation under Ahmadi.|سلام، یه رزرو به اسم احمدی دارم.
A|Welcome! Let me pull that up. Three nights, right?|خوش اومدید! بذارید پیداش کنم. سه شب، درسته؟
B|That's right. Is breakfast included?|درسته. صبحانه هم شامل می‌شه؟
A|It is. It's served from seven to ten in the lobby.|بله. از هفت تا ده توی لابی سرو می‌شه.
B|Great. And what's the Wi-Fi password?|عالیه. رمز وای‌فای چیه؟
A|It's on the card with your key. You're in room 412.|روی کارت کلیدتونه. اتاقتون ۴۱۲ـه.
B|Thanks. Oh, one more thing — what time is checkout?|ممنون. آهان، یه چیز دیگه — ساعت تحویل اتاق کیه؟
A|Eleven. But we can do a late checkout if you need.|یازده. ولی اگه لازم باشه می‌تونیم دیرتر بذاریم.
B|Awesome. I'll let you know.|عالیه. خبرتون می‌کنم.`,`
I have a reservation under...|یه رزرو به اسم ... دارم.
Let me pull that up.|بذارید پیداش کنم (روی سیستم).
That's right.|درسته.
Is breakfast included?|صبحانه شامل می‌شه؟
What's the Wi-Fi password?|رمز وای‌فای چیه؟
One more thing...|یه چیز دیگه...
What time is checkout?|ساعت تخلیه چنده؟
late checkout|تخلیه‌ی دیرتر
The AC isn't working.|کولر کار نمی‌کنه.
Could I get some extra towels?|می‌شه حوله‌ی اضافه بدید؟
Could I switch rooms?|می‌تونم اتاقم رو عوض کنم؟
Could you call me a cab?|برام تاکسی می‌گیرید؟
I'm checking out.|دارم اتاق رو تحویل می‌دم.`,`
I reserved a room with the name Ahmadi.|I have a reservation under Ahmadi.|under برای «به اسمِ» استفاده می‌شود.
The air conditioner is broken.|The AC isn't working.|AC = air conditioning.
Can you order a taxi for me?|Could you call me a cab?|cab = taxi.`,`
pull that up|پولدَت آپ|صدای th در that بعد از l ضعیف می‌شود.
one more thing|وان‌مُر ثینگ|th با زبان بین دندان، نه «س».`,`
مهمان چند شب می‌ماند؟|یک;سه;پنج|1
رمز وای‌فای کجاست؟|روی دیوار;روی کارت کلید;باید بپرسد|1`);

L("A2","🤒","پیش دکتر","احساس بیماری دارید و به دکتر می‌روید.","Doctor",`
A|So, what brings you in today?|خب، امروز برای چی اومدی؟
B|I've been feeling really sick since yesterday.|از دیروز حالم خیلی بده.
A|I'm sorry to hear that. What are your symptoms?|متأسفم. علائمت چیه؟
B|I've got a sore throat and a runny nose. And I'm kinda dizzy.|گلودرد دارم و آبریزش بینی. یه‌کم هم سرم گیج می‌ره.
A|Any fever?|تب داری؟
B|Yeah, I think I'm running a slight fever.|آره، فکر کنم یه‌کم تب دارم.
A|Okay, sounds like a cold. Get plenty of rest and drink lots of fluids.|باشه، به نظر سرماخوردگیه. زیاد استراحت کن و مایعات بخور.
B|Should I take anything for it?|باید چیزی بخورم؟
A|You can take some ibuprofen. If you don't feel better in a few days, come back.|می‌تونی ایبوپروفن بخوری. اگه چند روز دیگه بهتر نشدی، برگرد.`,`
What brings you in today?|برای چی اومدی؟ (دکتر)
I've been feeling sick.|حالم خوب نیست.
I'm sorry to hear that.|متأسفم که اینو می‌شنوم.
What are your symptoms?|علائمت چیه؟
sore throat|گلودرد
runny nose|آبریزش بینی
stuffy nose|گرفتگی بینی
I feel dizzy.|سرم گیج می‌ره.
running a fever|تب داشتن
I threw up.|بالا آوردم.
It hurts here.|اینجام درد می‌کنه.
Get some rest.|استراحت کن.
drink lots of fluids|مایعات زیاد بخور
I feel under the weather.|یه‌کم ناخوشم.
I'm coming down with something.|دارم مریض می‌شم.`,`
I have illness.|I'm feeling sick. / I'm under the weather.|under the weather یعنی کمی ناخوش.
I vomited.|I threw up.|throw up محاوره‌ای و رایج است.
My throat has pain.|I've got a sore throat.|سازه‌ی I've got در انگلیسی بریتانیایی و آمریکایی رایج است.`,`
I've got a|آیوگادِه|got a → «گادِه» (آمریکایی).
throat|ثروت|th + r: زبان بین دندان، نه «ت».`,`
بیمار چه علائمی ندارد؟|گلودرد;تب;درد شکم|2
دکتر چه توصیه‌ای می‌کند؟|جراحی;استراحت و مایعات;آنتی‌بیوتیک|1`);

L("A2","🎉","تعریف کردن از آخر هفته","دوشنبه با همکارتان درباره‌ی آخر هفته حرف می‌زنید.","Lisa",`
A|Hey! How was your weekend?|هی! آخر هفته چطور بود؟
B|It was awesome, actually. I went hiking with some friends.|راستش عالی بود. با چندتا از دوستام رفتیم کوه.
A|Oh nice! Where'd you go?|اِ چه خوب! کجا رفتید؟
B|Up to the mountains near the city. The view was insane.|کوه‌های نزدیک شهر. منظره‌ش دیوونه‌کننده بود.
A|Jealous! I just stayed home and binge-watched a show.|حسودیم شد! من فقط خونه موندم و یه سریال رو یه‌نفس دیدم.
B|Honestly, that sounds kinda nice too. What'd you watch?|راستش اونم یه‌جورایی خوبه. چی دیدی؟
A|This crime thing on Netflix. I'm totally hooked.|یه سریال جنایی توی نتفلیکس. حسابی معتادش شدم.
B|Ooh, send me the name!|اوه، اسمش رو برام بفرست!`,`
How was your weekend?|آخر هفته چطور بود؟
It was awesome.|عالی بود.
actually|راستش، در واقع
I went hiking.|رفتم کوه‌پیمایی.
Where'd you go?|کجا رفتی؟
The view was insane.|منظره فوق‌العاده بود. (عامیانه)
Jealous!|حسودیم شد! (به شوخی)
I just stayed home.|فقط خونه موندم.
binge-watch|یه‌نفس سریال دیدن
What'd you watch?|چی دیدی؟
I'm hooked.|معتادش شدم، گیرش افتادم.
It was a blast.|خیلی خوش گذشت.
Nothing special.|چیز خاصی نبود.
I just chilled.|فقط استراحت کردم.
I was wiped out.|خیلی خسته و کوفته بودم.`,`
The weekend was very good.|It was awesome. / It was a blast.|awesome و a blast برای لحن پرانرژی.
The scenery was very beautiful.|The view was insane.|insane در محاوره‌ی جوان‌ها یعنی فوق‌العاده.
I rested at home.|I just chilled at home.|chill = استراحت و ول‌گردی.`,`
Where'd you|وِردجو|did + you → «جو».
What'd you|واجو|What did you → «واجو».`,`
گوینده‌ی دوم آخر هفته چه کرد؟|کوه رفت;خانه ماند;کار کرد|0
لیسا چه کرد؟|سفر رفت;سریال دید;ورزش کرد|1`);
L("B1","💼","جلسه‌ی کاری","در جلسه‌ی تیم درباره‌ی پروژه صحبت می‌کنید.","Manager",`
A|Okay, let's get started. Where are we at with the app launch?|خب، شروع کنیم. پروژه‌ی راه‌اندازی اپ به کجا رسید؟
B|We're mostly on track, but we've hit a snag with the payment feature.|بیشترش طبق برنامه‌ست، ولی توی بخش پرداخت به مشکل خوردیم.
A|What kind of snag?|چه مشکلی؟
B|Basically, the bank's API keeps timing out. We're looking into it.|خلاصه، API بانک مدام قطع می‌شه. داریم بررسیش می‌کنیم.
A|Got it. Is that gonna push back the deadline?|فهمیدم. این باعث می‌شه ددلاین عقب بیفته؟
B|Maybe by a few days. I'll keep you posted.|شاید چند روز. در جریانت می‌ذارم.
A|Okay. Can you loop in Dave? He dealt with something similar last year.|باشه. دیو رو هم در جریان بذار؟ پارسال یه چیز مشابه رو حل کرد.
B|Good call. I'll reach out to him after the meeting.|فکر خوبیه. بعد از جلسه باهاش تماس می‌گیرم.
A|Great. Let's circle back on this Friday.|عالیه. جمعه دوباره بهش برمی‌گردیم.`,`
Let's get started.|شروع کنیم.
Where are we at with...?|... به کجا رسید؟
We're on track.|طبق برنامه پیش می‌ریم.
hit a snag|به مشکل خوردن
basically|خلاصه، در اصل
look into|بررسی کردن
Got it.|فهمیدم.
push back the deadline|عقب انداختن مهلت
I'll keep you posted.|در جریانت می‌ذارم.
loop someone in|کسی را در جریان قرار دادن
Good call.|تصمیم خوبیه.
reach out to|تماس گرفتن با
circle back|بعداً دوباره بررسی کردن
on the same page|هم‌نظر، هماهنگ
Let's take this offline.|بعد از جلسه جدا صحبت کنیم.
touch base|کوتاه هماهنگ کردن
I'm swamped.|سرم خیلی شلوغه.`,`
We have encountered a problem.|We've hit a snag.|hit a snag مؤدبانه و محاوره‌ای است.
I will inform you of updates.|I'll keep you posted.|در ایمیل و جلسه هر دو رایج است.
I will contact him.|I'll reach out to him.|reach out در محیط کار بسیار رایج است.`,`
Let's get started|لِتس گِدِستارتِد|t بین دو مصوت شبیه d نرم.
keep you posted|کیپ‌یو پُوستِد|t در posted واضح.`,`
مشکل پروژه چیست؟|طراحی;API پرداخت بانک;کمبود نیرو|1
قرار است با چه کسی تماس بگیرد؟|مدیر عامل;دیو;بانک|1`);

L("B1","😤","شکایت و پس دادن کالا","هدفون معیوبی خریده‌اید و می‌خواهید پس بدهید.","Customer service",`
B|Hi, I bought these headphones last week, and the left side stopped working.|سلام، هفته‌ی پیش این هدفون رو خریدم و سمت چپش از کار افتاده.
A|Oh, I'm sorry about that. Do you have the receipt?|اوه، متأسفم. رسیدش رو دارید؟
B|Yeah, here it is. I'd like a refund, please.|آره، بفرمایید. لطفاً پولم رو پس بدید.
A|Hmm, I can do an exchange, but refunds are only within seven days.|اوم، می‌تونم عوضش کنم، ولی بازپرداخت فقط تا هفت روزه.
B|It's been eight days. Come on, it's literally one day.|هشت روز گذشته. بی‌خیال، فقط یه روزه.
A|I get it, I really do. Let me talk to my manager.|درک می‌کنم، واقعاً. بذارید با مدیرم صحبت کنم.
B|I appreciate it. I'm just kinda frustrated, you know?|ممنونم. فقط یه‌کم کلافه‌ام، می‌دونی؟
A|Totally understandable. Okay, she said we can make an exception.|کاملاً قابل درکه. خب، گفت می‌تونیم استثنا قائل بشیم.
B|That's awesome. Thanks for going the extra mile.|عالیه. ممنون که بیشتر از وظیفه‌ت کمک کردی.`,`
stopped working|از کار افتاد
Do you have the receipt?|رسید دارید؟
I'd like a refund.|می‌خوام پولم رو پس بگیرم.
exchange|تعویض
Come on.|بی‌خیال / ای بابا.
literally|واقعاً، به معنای واقعی (تأکید محاوره‌ای)
I get it.|درک می‌کنم.
I appreciate it.|ممنونم، قدردانم.
I'm kinda frustrated.|یه‌کم کلافه‌ام.
you know?|می‌دونی؟ (پرکننده)
make an exception|استثنا قائل شدن
go the extra mile|بیشتر از انتظار تلاش کردن
It's a rip-off.|کلاه‌برداریه، گرون‌فروشیه.
This is unacceptable.|این قابل قبول نیست.
I want to speak to a manager.|می‌خوام با مدیر صحبت کنم.
It's not a big deal, but...|مسئله‌ی مهمی نیست، ولی...`,`
This product is broken. Give me my money.|I'd like a refund, please.|شکایت مؤدبانه و محکم نتیجه‌ی بهتری دارد.
I am angry.|I'm kinda frustrated.|frustrated مؤدبانه‌تر از angry است.
Thank you for your effort.|Thanks for going the extra mile.|اصطلاح رایج برای قدردانی.`,`
you know|یِنو|you know سریع و کوتاه می‌شود.
literally|لیتِرِلی|در آمریکا t شبیه d: «لیدِرِلی».`,`
چه مشکلی وجود دارد؟|سمت چپ هدفون کار نمی‌کند;رنگش بد است;گران است|0
نتیجه چه شد؟|رد شد;استثنا قائل شدند;فقط تعویض|1`);

L("B1","🧑‍💼","مصاحبه‌ی شغلی","در مصاحبه‌ی کاری درباره‌ی خودتان حرف می‌زنید.","Interviewer",`
A|So, tell me a little bit about yourself.|خب، یه‌کم از خودت بگو.
B|Sure. I'm a software developer, and I've been working in fintech for about four years.|حتماً. توسعه‌دهنده‌ی نرم‌افزارم و حدود چهار ساله توی فین‌تک کار می‌کنم.
A|What made you want to apply here?|چی باعث شد اینجا درخواست بدی؟
B|Honestly, I love what you guys are doing with AI, and I'm looking for a new challenge.|راستش کاری که با هوش مصنوعی می‌کنید رو دوست دارم و دنبال یه چالش جدیدم.
A|What would you say is your biggest weakness?|بزرگترین ضعفت چیه؟
B|I tend to take on too much. But I'm getting better at saying no.|معمولاً کار زیادی قبول می‌کنم. ولی دارم یاد می‌گیرم نه بگم.
A|Fair enough. Where do you see yourself in five years?|منطقیه. پنج سال دیگه خودت رو کجا می‌بینی؟
B|Ideally, leading a small team and building products people actually use.|در حالت ایده‌آل، رهبری یه تیم کوچیک و ساخت محصولاتی که مردم واقعاً استفاده کنن.
A|Great. Do you have any questions for me?|عالیه. سؤالی از من داری؟
B|Yeah, what does a typical day look like for this role?|آره، یه روز معمولی توی این نقش چه شکلیه؟`,`
Tell me about yourself.|از خودت بگو.
I've been working in ... for...|... ساله توی ... کار می‌کنم.
What made you want to...?|چی باعث شد بخوای...؟
apply|درخواست دادن
I'm looking for a new challenge.|دنبال چالش جدیدم.
I tend to...|معمولاً... / گرایش دارم که...
take on too much|کار زیاد قبول کردن
I'm getting better at...|دارم توی... بهتر می‌شم.
Fair enough.|منطقیه، قبول.
Where do you see yourself...?|خودت رو کجا می‌بینی؟
ideally|در حالت ایده‌آل
What does a typical day look like?|یه روز معمولی چه شکلیه؟
I'm a team player.|اهل کار تیمی‌ام.
I thrive under pressure.|زیر فشار بهتر کار می‌کنم.
That's a great question.|سؤال خوبیه. (برای وقت خریدن)
salary expectations|حقوق مورد انتظار`,`
I am working here since 4 years.|I've been working here for four years.|خطای رایج فارسی‌زبانان: برای مدت از present perfect + for استفاده کنید.
My weakness is perfectionism.|I tend to take on too much, but...|جواب‌های کلیشه‌ای را مصاحبه‌گرها دوست ندارند؛ ضعف واقعی + راه‌حل.
I want to have more money.|I'm looking for a new challenge.|انگیزه را مثبت بیان کنید.`,`
tell me a little bit|تِلمی اِ لیدِل بِت|little در آمریکایی «لیدِل».
What would you say|واوُدجو سِی|would + you → «وودجو».`,`
متقاضی چند سال سابقه دارد؟|دو;چهار;ده|1
ضعف او چیست؟|تنبلی;قبول کار زیاد;دیر رسیدن|1`);

L("B1","❤️","قرار اول (Dating)","در اولین قرار با کسی آشنا می‌شوید.","Alex",`
A|So, how's your week been?|خب، هفته‌ت چطور گذشت؟
B|Kinda crazy, honestly. But I'm glad we finally got to do this.|راستش یه‌کم شلوغ. ولی خوشحالم بالاخره قرارمون جور شد.
A|Same! So what do you do for fun?|منم! برای تفریح چی کار می‌کنی؟
B|I'm really into photography. And I'm a huge foodie.|خیلی به عکاسی علاقه دارم. شکمو هم هستم حسابی.
A|No way, me too! Have you tried that Persian place on Main?|نه بابا، منم! اون رستوران ایرانیه توی خیابون مین رو رفتی؟
B|Are you kidding? I'm Persian! Their kabob is legit.|شوخی می‌کنی؟ من ایرانی‌ام! کبابشون واقعاً خوبه.
A|Ha, okay, so you're the expert. Maybe you can show me around sometime.|ها، پس تو متخصصی. شاید یه وقت منو ببری بگردونی.
B|I'd like that. So, are you more of a morning person or a night owl?|خوشم میاد. راستی، سحرخیزی یا شب‌بیدار؟
A|Total night owl. You?|کاملاً شب‌بیدار. تو؟
B|Same. I think we're gonna get along just fine.|منم. فکر کنم خیلی با هم کنار بیایم.`,`
How's your week been?|هفته‌ت چطور بود؟
kinda crazy|یه‌کم شلوغ و دیوونه‌وار
I'm glad we finally...|خوشحالم بالاخره...
What do you do for fun?|برای تفریح چی کار می‌کنی؟
I'm really into...|خیلی به ... علاقه دارم.
foodie|عاشق غذا، شکمو
No way!|نه بابا! جدی؟
Are you kidding?|شوخی می‌کنی؟
legit|واقعی، درجه‌یک (عامیانه)
show someone around|جایی را به کسی نشان دادن
I'd like that.|خوشم میاد / دوست دارم.
morning person|آدم سحرخیز
night owl|شب‌بیدار
get along|کنار اومدن، با هم جور بودن
I had a great time.|خیلی بهم خوش گذشت.
Wanna do this again sometime?|بازم همدیگه رو ببینیم؟
hit it off|زود با هم جور شدن`,`
What are your hobbies?|What do you do for fun?|«hobbies» کمی کتابی و مصاحبه‌ای به نظر می‌رسد.
I am interested in photography.|I'm really into photography.|be into = علاقه داشتن (خودمونی).
Really? Me too!|No way, me too!|No way برای شگفتی، نه مخالفت.`,`
Are you kidding?|آریو کیدین|ing → «این».
get along|گِدِلانگ|t نرم و وصل.`,`
گوینده‌ی دوم به چه علاقه دارد؟|ورزش;عکاسی و غذا;موسیقی|1
الکس چه تیپی است؟|سحرخیز;شب‌بیدار;معلوم نیست|1`);

L("B1","📖","تعریف کردن یک ماجرا","ماجرای خنده‌داری که برایتان اتفاق افتاده تعریف می‌کنید.","Ben",`
B|Dude, you won't believe what happened to me yesterday.|رفیق، باورت نمی‌شه دیروز چی شد.
A|Uh-oh. What happened?|اوه‌اوه. چی شد؟
B|So I'm on the train, right? And I'm like half asleep.|خب من توی قطارم، خب؟ و تقریباً نیمه‌خوابم.
A|Okay...|خب...
B|And all of a sudden, this guy sits next to me and starts eating my chips.|که یهو یه یارو کنارم می‌شینه و شروع می‌کنه چیپس منو خوردن.
A|Wait, what? Your chips?|صبر کن، چی؟ چیپس تو؟
B|That's what I thought! So I grab a few too, you know, to make a point.|منم همینو فکر کردم! منم چندتا برداشتم، که یعنی حرفمو بزنم.
A|Ha! And then?|ها! بعدش؟
B|Turns out, my chips were in my bag the whole time. I was eating HIS.|معلوم شد چیپس من کل این مدت توی کیفم بوده. من داشتم مال اونو می‌خوردم.
A|No way! That's hilarious.|نه بابا! خیلی خنده‌داره.`,`
You won't believe...|باورت نمی‌شه...
Dude|رفیق، داداش (عامیانه)
So I'm on the train, right?|خب من توی قطارم، خب؟ (حال روایی)
I'm like...|من این‌جوری بودم که... (پرکننده)
half asleep|نیمه‌خواب
all of a sudden|یهو، ناگهان
this guy|یه یارو
Wait, what?|صبر کن، چی؟
That's what I thought!|منم همینو فکر کردم!
to make a point|برای رسوندن منظور
And then?|بعدش؟
Turns out...|معلوم شد که...
the whole time|کل این مدت
That's hilarious.|خیلی خنده‌داره.
Long story short...|خلاصه‌ش کنم...
I was so embarrassed.|خیلی خجالت کشیدم.
I couldn't stop laughing.|نمی‌تونستم جلوی خندمو بگیرم.`,`
Yesterday a man sat next to me.|So this guy sits next to me...|بومی‌ها در قصه‌گویی اغلب از زمان حال (narrative present) استفاده می‌کنند.
Suddenly...|All of a sudden...|هر دو درست‌اند؛ all of a sudden در گفتار رایج‌تر.
It became clear that...|Turns out...|Turns out بدون It در گفتار سریع.`,`
all of a sudden|آلِوِه سادِن|کلمات کاملاً به هم می‌چسبند.
what happened|وا‌هَپِند|t در what حذف یا قطع می‌شود.`,`
مرد غریبه چه می‌خورد؟|ساندویچ;چیپس;شکلات|1
نکته‌ی خنده‌دار چه بود؟|چیپس مال مرد بود;مرد دوستش بود;قطار ایستاد|0`);

L("B1","🏠","هم‌خانه و مشکلات خانه","با هم‌خانه‌تان درباره‌ی تمیزکاری صحبت می‌کنید.","Roommate",`
B|Hey, got a sec? I wanted to talk about something.|هی، یه لحظه وقت داری؟ می‌خواستم درباره‌ی یه چیزی حرف بزنم.
A|Sure, what's up?|حتماً، چی شده؟
B|So, the dishes have kinda been piling up lately.|خب، این اواخر ظرف‌ها یه‌کم روی هم تلنبار شدن.
A|Oh, yeah, my bad. I've been super busy with work.|آهان، آره، تقصیر من. خیلی سرم با کار شلوغ بوده.
B|No worries, I get it. Maybe we could make a cleaning schedule?|اشکال نداره، می‌فهمم. شاید بتونیم یه برنامه‌ی تمیزکاری بذاریم؟
A|That's a good idea. I can take care of the kitchen if you handle the bathroom.|فکر خوبیه. من آشپزخونه رو انجام می‌دم اگه تو حموم رو بکنی.
B|Deal. Also, could you keep it down a bit after eleven? I wake up early.|قبول. راستی، می‌شه بعد از یازده یه‌کم آروم‌تر باشی؟ من صبح زود پا می‌شم.
A|Oh, totally. Sorry, I didn't realize.|اوه، حتماً. ببخشید، متوجه نبودم.
B|Thanks for being cool about it.|ممنون که راحت باهاش کنار اومدی.`,`
Got a sec?|یه لحظه وقت داری؟
I wanted to talk about something.|می‌خواستم درباره‌ی چیزی صحبت کنم.
pile up|تلنبار شدن
lately|این اواخر
My bad.|تقصیر من. (خودمونی)
super busy|خیلی سرشلوغ
take care of|رسیدگی کردن به
handle|از پسش بر اومدن، انجام دادن
Deal.|قبول. / معامله.
keep it down|سر و صدا رو کم کردن
I didn't realize.|متوجه نبودم.
Thanks for being cool about it.|ممنون که منطقی برخورد کردی.
take turns|نوبتی انجام دادن
split the bills|قبض‌ها رو تقسیم کردن
It's driving me crazy.|داره دیوونه‌م می‌کنه.`,`
You never wash the dishes!|The dishes have kinda been piling up.|برای انتقاد غیرمستقیم و نرم از kinda و lately استفاده می‌شود.
It is my fault.|My bad.|My bad برای اشتباهات کوچک.
Please be quiet.|Could you keep it down a bit?|درخواست مؤدبانه‌تر.`,`
got a sec|گادِه سِک|got a → «گادِه».
keep it down|کیپِت داون|it ضعیف.`,`
مشکل اصلی چیست؟|اجاره;ظرف‌های تلنبارشده;مهمان‌ها|1
چه کسی حمام را تمیز می‌کند؟|هم‌خانه;گوینده‌ی دوم (شما);نوبتی|1`);
L("B2","🗣️","بحث و اظهار نظر","با دوستتان درباره‌ی کار از راه دور بحث می‌کنید.","Jordan",`
A|Honestly, I think remote work is totally overrated.|راستش فکر می‌کنم دورکاری بیش از حد بزرگ شده.
B|Really? I'd have to disagree. I'm way more productive at home.|جدی؟ باید مخالفت کنم. من خونه خیلی بهره‌ورترم.
A|Sure, but don't you miss, like, actually seeing people?|باشه، ولی دلت برای اینکه واقعاً آدم‌ها رو ببینی تنگ نمی‌شه؟
B|I see where you're coming from, but I'd rather skip the two-hour commute.|می‌فهمم منظورت چیه، ولی ترجیح می‌دم دو ساعت رفت‌وآمد رو نداشته باشم.
A|Fair point. But what about younger employees? How are they supposed to learn?|نکته‌ی درستیه. ولی کارمندای جوون‌تر چی؟ چطوری باید یاد بگیرن؟
B|That's actually a good point. Maybe hybrid is the way to go.|اتفاقاً حرف درستیه. شاید ترکیبی بهترین راهه.
A|Yeah, I could get behind that.|آره، با این می‌تونم موافق باشم.
B|See? We're not that far apart after all.|دیدی؟ آخرش اونقدرا هم با هم فاصله نداریم.`,`
overrated|بیش از حد بزرگ‌شده
I'd have to disagree.|باید مخالفت کنم.
way more|خیلی بیشتر
I see where you're coming from.|می‌فهمم منظورت از کجاست.
I'd rather...|ترجیح می‌دم...
Fair point.|نکته‌ی منطقیه.
That's a good point.|حرف درستیه.
the way to go|بهترین راه
I could get behind that.|با این موافقم / حمایتش می‌کنم.
not that far apart|نظرمون خیلی دور نیست
To be fair...|انصافاً...
I'm not so sure about that.|زیاد مطمئن نیستم.
That's not the point.|بحث این نیست.
You've got a point there.|اینجا حق با توئه.
Let's agree to disagree.|بیا قبول کنیم هم‌نظر نیستیم.
At the end of the day...|در نهایت...
It depends.|بستگی داره.
on the fence|دودل، بی‌طرف`,`
You are wrong.|I'm not so sure about that.|مخالفت مستقیم در فرهنگ انگلیسی‌زبان تند است.
I understand your opinion.|I see where you're coming from.|نشان می‌دهد طرف را درک کرده‌اید.
I prefer not to commute.|I'd rather skip the commute.|I'd rather بسیار رایج است.`,`
I'd rather|آیدرَدِر|th در rather نرم و d مانند.
coming from|کامین فرام|ing → «این».`,`
نظر گوینده‌ی دوم درباره‌ی دورکاری چیست؟|مخالف است;در خانه بهره‌ورتر است;مطمئن نیست|1
به چه نتیجه‌ای می‌رسند؟|کاملاً حضوری;کار ترکیبی;کاملاً دورکاری|1`);

L("B2","💰","درخواست افزایش حقوق","با مدیرتان درباره‌ی افزایش حقوق مذاکره می‌کنید.","Boss",`
B|Thanks for making time. I wanted to talk about my compensation.|ممنون که وقت گذاشتید. می‌خواستم درباره‌ی حقوقم صحبت کنم.
A|Sure, go ahead.|حتماً، بفرما.
B|Over the past year, I've taken on a lot more responsibility — I've been leading the mobile team since March.|توی یک سال گذشته مسئولیت خیلی بیشتری گرفتم — از مارس تیم موبایل رو رهبری می‌کنم.
A|You have, and we've noticed.|درسته، و ما متوجه شدیم.
B|Based on that, and what the market's paying, I think a fifteen percent raise is fair.|بر اساس اون و حقوق بازار، فکر می‌کنم پونزده درصد افزایش منصفانه‌ست.
A|Fifteen's a bit of a stretch, to be honest. Budgets are tight right now.|راستش پونزده یه‌کم زیاده. بودجه الان محدوده.
B|I totally get that. Is there any wiggle room? Maybe we meet halfway?|کاملاً درک می‌کنم. جای انعطاف هست؟ شاید وسط رو بگیریم؟
A|Let me see what I can do. I can probably swing ten, plus an extra week of PTO.|بذار ببینم چی کار می‌تونم بکنم. احتمالاً بتونم ده درصد جور کنم، به‌علاوه یه هفته مرخصی اضافه.
B|That sounds reasonable. Can we get that in writing?|منطقیه. می‌شه کتبی باشه؟`,`
Thanks for making time.|ممنون که وقت گذاشتید.
compensation|حقوق و مزایا
Go ahead.|بفرما، ادامه بده.
take on responsibility|مسئولیت پذیرفتن
We've noticed.|متوجه شدیم.
Based on that...|بر این اساس...
a raise|افزایش حقوق
a bit of a stretch|یه‌کم زیاده‌روی
Budgets are tight.|بودجه محدوده.
wiggle room|جای انعطاف / چونه
meet halfway|وسط رو گرفتن، کوتاه اومدن هر دو طرف
Let me see what I can do.|ببینم چی کار می‌تونم بکنم.
swing|جور کردن، از پسش بر اومدن (عامیانه)
PTO (paid time off)|مرخصی با حقوق
That sounds reasonable.|منطقیه.
get it in writing|کتبی کردن
a ballpark figure|یه عدد تقریبی
That's a deal-breaker.|این خط قرمزه.`,`
I want more money.|I wanted to talk about my compensation.|شروع غیرمستقیم و حرفه‌ای.
Can you reduce/increase a little?|Is there any wiggle room?|wiggle room در مذاکره رایج است.
Let's compromise.|Maybe we meet halfway?|طبیعی‌تر از compromise در گفتار.`,`
a bit of a stretch|اِ بیدِوِه اِسترِچ|of ضعیف و «اِو».
Let me see|لِمی سی|let me → lemme.`,`
چه افزایشی درخواست شد؟|ده درصد;پانزده درصد;بیست درصد|1
توافق نهایی چیست؟|هیچ;ده درصد و یک هفته مرخصی;پانزده درصد|1`);

L("B2","✈️","مشکل در فرودگاه","پروازتان کنسل شده و با کارمند صحبت می‌کنید.","Agent",`
B|Hi, my flight to Frankfurt just got canceled. What are my options?|سلام، پروازم به فرانکفورت همین الان کنسل شد. چه گزینه‌هایی دارم؟
A|I'm so sorry about that. Let me take a look. The next available flight is tomorrow at 6 a.m.|خیلی متأسفم. بذارید نگاه کنم. پرواز بعدی فردا ساعت شش صبحه.
B|Tomorrow? I've got a connecting flight. Is there anything sooner, maybe through another city?|فردا؟ من پرواز ترانزیت دارم. زودتر چیزی نیست، شاید از یه شهر دیگه؟
A|I could put you on a flight to Munich tonight, and then a train to Frankfurt.|می‌تونم امشب بذارمتون روی پرواز مونیخ، و بعد قطار به فرانکفورت.
B|That works. Will my bag get rerouted, or do I need to pick it up?|خوبه. چمدونم مسیرش عوض می‌شه یا باید تحویلش بگیرم؟
A|It'll be transferred automatically.|خودکار منتقل می‌شه.
B|And since this is on you guys, am I entitled to a meal voucher?|و چون تقصیر شماست، کوپن غذا بهم تعلق می‌گیره؟
A|Absolutely. Here's a twenty-dollar voucher. Again, sorry for the hassle.|حتماً. این یه کوپن بیست دلاریه. باز هم بابت دردسر عذر می‌خوام.
B|No worries, these things happen. Thanks for sorting it out so fast.|اشکال نداره، پیش میاد. ممنون که انقدر سریع حلش کردید.`,`
My flight got canceled.|پروازم کنسل شد.
What are my options?|چه گزینه‌هایی دارم؟
Let me take a look.|بذارید نگاه کنم.
the next available flight|اولین پرواز موجود
connecting flight|پرواز ترانزیت
anything sooner|چیزی زودتر
put you on a flight|براتون پرواز گرفتن
That works.|اوکیه، جور است.
rerouted|تغییر مسیر داده‌شده
It's on you.|تقصیر/حساب شماست.
Am I entitled to...?|آیا ... به من تعلق می‌گیره؟
meal voucher|کوپن غذا
sorry for the hassle|ببخشید بابت دردسر
These things happen.|پیش میاد.
sort it out|حل و فصلش کردن
I'm on a tight schedule.|وقتم خیلی تنگه.
layover|توقف بین دو پرواز
My luggage didn't show up.|چمدونم نیومد.`,`
What can I do now?|What are my options?|سؤالی حرفه‌ای که به راه‌حل می‌رسد.
Do I have the right to get food?|Am I entitled to a meal voucher?|entitled to = مستحق.
You solved it quickly.|Thanks for sorting it out so fast.|sort out در بریتانیا و آمریکا رایج است.`,`
got canceled|گات کَنسِلد|t ابتدای سکوت کوتاه دارد (glottal stop).
sort it out|سُردِدات|آمریکایی: t ها نرم و وصل.`,`
راه‌حل نهایی چیست؟|پرواز فردا;پرواز به مونیخ و قطار;برگشت به خانه|1
کوپن غذا چقدر است؟|ده دلار;بیست دلار;پنجاه دلار|1`);

L("B2","🫂","عذرخواهی و گفتگوی حساس","از دوستتان برای فراموش کردن تولدش عذرخواهی می‌کنید.","Nina",`
B|Hey, can we talk? I owe you an apology.|هی، می‌تونیم حرف بزنیم؟ یه عذرخواهی بهت بدهکارم.
A|Oh? About what?|اِ؟ درباره‌ی چی؟
B|I completely spaced on your birthday. There's no excuse, and I feel terrible.|تولدت رو کاملاً یادم رفت. هیچ بهونه‌ای نیست و خیلی حالم بده.
A|Yeah, honestly, it kinda stung. I thought you'd at least text.|آره، راستش یه‌کم دلم شکست. فکر کردم حداقل پیام بدی.
B|You're right. I've been all over the place lately, but that's on me.|حق با توئه. این اواخر خیلی به‌هم‌ریخته بودم، ولی تقصیر خودمه.
A|I appreciate you saying that.|ممنون که اینو می‌گی.
B|Let me make it up to you. Dinner this weekend? My treat.|بذار جبران کنم. این آخر هفته شام؟ مهمون من.
A|Okay, fine. But you're picking a good place.|باشه، قبول. ولی باید یه جای خوب انتخاب کنی.
B|Deal. And I promise it won't happen again.|قبول. و قول می‌دم دیگه تکرار نشه.
A|Apology accepted. We're good.|عذرخواهی قبوله. مشکلی نداریم.`,`
Can we talk?|می‌تونیم حرف بزنیم؟
I owe you an apology.|یه عذرخواهی بهت بدهکارم.
space on something|کاملاً فراموش کردن (عامیانه)
There's no excuse.|هیچ بهونه‌ای نیست.
I feel terrible.|خیلی ناراحتم / عذاب وجدان دارم.
It stung.|دلم شکست / ناراحتم کرد.
at least|حداقل
You're right.|حق با توئه.
all over the place|به‌هم‌ریخته، پریشون
That's on me.|تقصیر منه.
make it up to you|جبران کردن برای تو
It won't happen again.|دیگه تکرار نمی‌شه.
We're good.|مشکلی بینمون نیست.
No hard feelings.|کدورتی نیست.
I didn't mean to...|قصد نداشتم...
I should have...|باید ... می‌کردم.
clear the air|رفع کدورت کردن`,`
Sorry, I was busy.|There's no excuse, and I feel terrible.|عذرخواهی بومی بدون بهانه‌تراشی است.
It was my fault.|That's on me.|That's on me مسئولیت‌پذیری محاوره‌ای.
I will compensate.|Let me make it up to you.|compensate بیش از حد رسمی است.`,`
owe you an|اُیو وِن|you و an به هم وصل.
should have|شودِو|should've → «شودِو» (نه should of).`,`
گوینده‌ی دوم چه را فراموش کرده بود؟|قرار ناهار;تولد نینا;پس دادن پول|1
چطور جبران می‌کند؟|هدیه;شام آخر هفته;گل|1`);

L("B2","😩","درد دل از روز بد","یک روز افتضاح داشتید و برای دوستتان تعریف می‌کنید.","Sam",`
A|You look exhausted. Rough day?|خیلی خسته به نظر میای. روز سختی بود؟
B|Ugh, don't even get me started. Everything that could go wrong did.|اَه، اصلاً نپرس. هر چی می‌تونست خراب بشه، خراب شد.
A|Oh no. Spill.|ای وای. بگو ببینم.
B|First, I overslept, so I missed the bus. Then my laptop died right before my presentation.|اول، خواب موندم و اتوبوس رو از دست دادم. بعد لپ‌تاپم درست قبل از ارائه‌م خاموش شد.
A|Oof. Did you have a backup?|اوف. نسخه‌ی پشتیبان داشتی؟
B|Nope. I had to wing it. And then my boss called me out in front of everyone.|نه. مجبور شدم بداهه بگم. بعد رئیسم جلوی همه ازم ایراد گرفت.
A|That's brutal. I'm sorry, that sucks.|خیلی بی‌رحمانه‌ست. متأسفم، خیلی بده.
B|Thanks. I just need to vent, I guess.|ممنون. فکر کنم فقط لازم دارم خالی بشم.
A|Vent away. Want me to grab some ice cream?|هر چی می‌خوای بگو. بستنی بگیرم؟
B|You're a lifesaver.|تو فرشته‌ی نجاتی.`,`
You look exhausted.|خیلی خسته به نظر میای.
Rough day?|روز سختی بود؟
Don't even get me started.|اصلاً نپرس / شروعم نکن.
Everything that could go wrong did.|هرچی می‌شد خراب بشه، شد.
Spill.|بگو ببینم (عامیانه)
I overslept.|خواب موندم.
My laptop died.|لپ‌تاپم خاموش شد / خراب شد.
wing it|بداهه انجام دادن
call someone out|جلوی جمع از کسی ایراد گرفتن
That's brutal.|خیلی بی‌رحمانه / سخته.
That sucks.|خیلی بده. (عامیانه)
I need to vent.|لازم دارم درد دل کنم.
You're a lifesaver.|تو نجاتم دادی.
I'm fed up.|کلافه‌ام، خسته شدم.
It's been one of those days.|از اون روزا بود.
at the end of my rope|کاسه‌ی صبرم لبریزه
cheer up|سرحال اومدن / شاد کردن`,`
It was a bad day.|It's been one of those days.|اصطلاح رایج برای روز پر از اتفاق بد.
I improvised.|I had to wing it.|wing it خیلی رایج و محاوره‌ای.
That is very bad.|That sucks. / That's brutal.|sucks عامیانه است؛ در محیط رسمی استفاده نکنید.`,`
don't even get me started|دونیوِن گِدمی استارتِد|t ها حذف یا نرم می‌شوند.
want me to|وانمی‌تو|t حذف: wanna me → «وانمی».`,`
اولین اتفاق بد چه بود؟|لپ‌تاپ خاموش شد;خواب ماند;رئیس ایراد گرفت|1
دوستش چه پیشنهادی می‌دهد؟|قهوه;بستنی;سینما|1`);

L("B2","🏡","اجاره‌ی خانه و مذاکره با صاحبخانه","برای دیدن یک آپارتمان رفته‌اید.","Landlord",`
A|So this is the living room. Lots of natural light, as you can see.|خب این نشیمنه. همون‌طور که می‌بینید نور طبیعی زیادی داره.
B|It's really nice. Are utilities included in the rent?|خیلی خوبه. قبض‌ها شامل اجاره می‌شه؟
A|Water and trash are. Electricity and internet are on you.|آب و زباله آره. برق و اینترنت با خودتونه.
B|Got it. And how long is the lease?|فهمیدم. قرارداد چقدره؟
A|Twelve months, with first and last month's rent upfront.|دوازده ماه، با پرداخت پیش‌پیش اجاره‌ی ماه اول و آخر.
B|Is there any flexibility on the rent? It's a little over my budget.|روی اجاره انعطافی هست؟ یه‌کم از بودجه‌م بیشتره.
A|I might be able to knock off fifty bucks if you sign for eighteen months.|شاید بتونم پنجاه دلار کم کنم اگه هجده ماهه امضا کنی.
B|Hmm, let me sleep on it. Are pets allowed?|اوم، بذارید روش فکر کنم. حیوون خونگی مجازه؟
A|Cats are fine, no dogs.|گربه اشکال نداره، سگ نه.
B|Perfect. I'll get back to you by Friday.|عالیه. تا جمعه بهتون خبر می‌دم.`,`
natural light|نور طبیعی
Are utilities included?|قبض‌ها شامل می‌شه؟
rent|اجاره
lease|قرارداد اجاره
upfront|پیش‌پرداخت، از قبل
security deposit|ودیعه
over my budget|بیشتر از بودجه‌م
Is there any flexibility?|انعطافی هست؟
knock off|کم کردن (از قیمت)
bucks|دلار (عامیانه)
sleep on it|روش فکر کردن (تا فردا)
Are pets allowed?|حیوون خونگی مجازه؟
I'll get back to you.|بعداً خبرتون می‌کنم.
move in / move out|اسباب‌کشی کردن (به / از)
The faucet is leaking.|شیر آب چکه می‌کنه.
fix it ASAP|هر چه زودتر درستش کردن`,`
Can you decrease the price?|Is there any flexibility on the rent?|مذاکره‌ی غیرمستقیم مؤدبانه‌تر است.
I need to think about it.|Let me sleep on it.|اصطلاح طبیعی برای فرصت گرفتن.
dollars|bucks|bucks در محاوره‌ی آمریکایی.`,`
knock off fifty bucks|ناکاف فیفتی باکس|knock و off پیوسته.
let me sleep on it|لِمی اسلیپانِت|on و it وصل.`,`
کدام قبض شامل اجاره نیست؟|آب;برق و اینترنت;زباله|1
صاحبخانه با چه شرطی تخفیف می‌دهد؟|پرداخت نقدی;قرارداد هجده‌ماهه;بدون حیوان|1`);
L("C1","🚀","ارائه‌ی ایده (Pitch)","ایده‌ی استارتاپتان را به یک سرمایه‌گذار معرفی می‌کنید.","Investor",`
A|Alright, you've got five minutes. Wow me.|خب، پنج دقیقه وقت داری. شگفت‌زده‌م کن.
B|So here's the thing: millions of people want to speak English, but textbooks just don't cut it.|خب موضوع اینه: میلیون‌ها نفر می‌خوان انگلیسی حرف بزنن، ولی کتاب‌های درسی کافی نیستن.
A|Okay, but that space is pretty crowded. What sets you apart?|باشه، ولی این حوزه خیلی شلوغه. چی شما رو متمایز می‌کنه؟
B|We're laser-focused on one market — Persian speakers — and we tackle their specific pain points head-on.|ما کاملاً روی یه بازار متمرکزیم — فارسی‌زبان‌ها — و مستقیماً سراغ مشکلات خاصشون می‌ریم.
A|Interesting. What kind of traction do you have?|جالبه. چه میزان استقبال داشتید؟
B|We're sitting at twenty thousand users, and retention's way above the industry average.|الان بیست هزار کاربر داریم و نرخ ماندگاری خیلی بالاتر از میانگین صنعته.
A|And how do you plan to monetize?|و چطور می‌خواید درآمدزایی کنید؟
B|Freemium, essentially. The core stuff is free; the AI tutor is where the money's at.|اساساً فریمیوم. بخش اصلی رایگانه؛ پول اصلی توی معلم هوش مصنوعیه.
A|I like it. Send me your deck and let's set up a follow-up.|خوشم اومد. ارائه‌ت رو بفرست و یه جلسه‌ی پیگیری بذاریم.`,`
Wow me.|شگفت‌زده‌م کن.
Here's the thing...|موضوع اینه که...
don't cut it|کافی نیست، جواب نمی‌ده
the space is crowded|بازار شلوغه
What sets you apart?|چی شما رو متمایز می‌کنه؟
laser-focused|کاملاً متمرکز
pain points|مشکلات اصلی مشتری
tackle head-on|مستقیم با مشکل روبرو شدن
traction|استقبال، رشد اولیه
We're sitting at...|الان در ... هستیم (آمار)
retention|ماندگاری کاربر
monetize|درآمدزایی کردن
essentially|اساساً
where the money's at|جایی که پول اصلی هست
deck (pitch deck)|اسلایدهای ارائه
set up a follow-up|جلسه‌ی پیگیری گذاشتن
game-changer|تحول‌آفرین
scalable|مقیاس‌پذیر
low-hanging fruit|کارهای آسان و پرسود`,`
Our product is very good and unique.|What sets us apart is...|ادعای کلی ضعیف است؛ تمایز مشخص بگویید.
We have many users.|We're sitting at twenty thousand users.|عدد دقیق و فعل sitting at حرفه‌ای‌تر است.
Textbooks are not sufficient.|Textbooks just don't cut it.|don't cut it محاوره‌ای و پرقدرت.`,`
here's the thing|هیرز دِه ثینگ|the ضعیف «دِه».
what sets you apart|وات سِچو اَپارت|t + you → «چو».`,`
سرمایه‌گذار از چه چیزی نگران است؟|قیمت;شلوغی بازار;تیم|1
مدل درآمدی چیست؟|تبلیغات;فریمیوم;فروش یک‌باره|1`);

L("C1","😏","طعنه، شوخی و کل‌کل (Banter)","با همکار بریتانیایی‌تان شوخی و کل‌کل می‌کنید.","Oliver",`
A|Oh, look who decided to show up. Nice of you to join us.|اوه، ببین کی تصمیم گرفت پیداش بشه. لطف کردی تشریف آوردی.
B|Yeah, yeah. The trains were a nightmare, cheers for asking.|آره آره. قطارها افتضاح بودن، مرسی که پرسیدی.
A|Classic. You'd be late to your own funeral, mate.|همیشگی. تو حتی به مراسم خاکسپاری خودتم دیر می‌رسی، رفیق.
B|Says the guy who forgot his own presentation last week.|اینو کسی می‌گه که هفته‌ی پیش ارائه‌ی خودشو یادش رفت.
A|Ouch. Low blow. I'll have you know that was a strategic choice.|آخ. ضربه‌ی زیر کمربند. بدون که اون یه انتخاب استراتژیک بود.
B|Oh, sure it was. Totally believable.|آره حتماً. کاملاً باورکردنیه.
A|Alright, alright, fair play. Tea?|باشه باشه، قبول، حق با تو. چای؟
B|Go on then. You're buying, though.|باشه بریم. ولی حساب با تو.
A|Cheeky. Fine, I'll get this one.|پررو. باشه، این یکی با من.`,`
Look who decided to show up.|ببین کی پیداش شد. (طعنه)
Nice of you to join us.|لطف کردی اومدی. (طعنه)
a nightmare|افتضاح، کابوس
Cheers.|مرسی (بریتانیایی)
Classic.|همیشگی، از تو بعید نیست.
mate|رفیق (بریتانیایی/استرالیایی)
Says the guy who...|اینو کسی می‌گه که...
low blow|ضربه‌ی ناجوانمردانه
I'll have you know...|بدون که... (با تظاهر به جدیت)
Oh, sure it was.|آره حتماً! (طعنه)
Totally believable.|کاملاً باورکردنی (طعنه)
fair play|قبول، حق با توئه (بریتانیایی)
Go on then.|باشه، قبول (بریتانیایی)
cheeky|پررو، شیطون (با محبت)
I'll get this one.|این یکی با من.
taking the mickey|سر به سر گذاشتن (بریتانیایی)
No offense, but...|بهت برنخوره، ولی...
I'm just pulling your leg.|دارم سر به سرت می‌ذارم.`,`
Why are you late?|Look who decided to show up.|طعنه‌ی دوستانه بخشی از فرهنگ کل‌کل بریتانیایی است — لحن مهم است.
Thank you.|Cheers.|Cheers در بریتانیا هم «ممنون» است، هم «به سلامتی».
You are right.|Fair play.|عبارت بریتانیایی برای پذیرفتن نکته‌ی طرف.`,`
Nice of you to|نایسِویو تو|of → «اِو» ضعیف.
I'll have you know|آیل هَویو نُو|have کامل اما سریع.`,`
چرا گوینده‌ی دوم دیر رسید؟|خواب ماند;قطارها مشکل داشتند;ترافیک|1
در نهایت چه کسی پول چای را می‌دهد؟|اولیور;گوینده‌ی دوم;هیچ‌کس|0`);

L("C1","🤝","مخالفت دیپلماتیک در جلسه","با پیشنهاد همکار ارشد مؤدبانه مخالفت می‌کنید.","Director",`
A|So I'm thinking we cut the marketing budget by thirty percent next quarter.|خب فکر می‌کنم بودجه‌ی بازاریابی فصل بعد رو سی درصد کم کنیم.
B|I can see the logic there, but I do have some reservations.|منطقش رو می‌فهمم، ولی چندتا تردید دارم.
A|Go on.|بگو.
B|If we pull back now, we risk losing the momentum we've built since spring.|اگه الان عقب بکشیم، ممکنه شتابی که از بهار ساختیم رو از دست بدیم.
A|Sure, but the numbers aren't adding up.|درسته، ولی اعداد جور در نمیان.
B|Fair enough. What if, instead of a blanket cut, we trimmed the channels that are underperforming?|منطقیه. اگه به جای کاهش کلی، فقط کانال‌هایی که بازده ضعیف دارن رو کم کنیم چی؟
A|Hmm. That's not a bad shout. Can you put some figures together?|اوم. فکر بدی نیست. می‌تونی چندتا عدد آماده کنی؟
B|Absolutely. I'll have something on your desk by Thursday.|حتماً. تا پنجشنبه یه چیزی روی میزتون می‌ذارم.
A|Great. Let's revisit it then.|عالیه. اون موقع دوباره بررسیش می‌کنیم.`,`
I can see the logic there, but...|منطقش رو می‌فهمم، ولی...
I have some reservations.|چندتا تردید دارم.
Go on.|ادامه بده.
pull back|عقب کشیدن
we risk ...ing|خطر ... رو داریم
lose momentum|شتاب رو از دست دادن
The numbers don't add up.|اعداد جور در نمیاد.
What if, instead...|اگه به جای ... چی؟
a blanket cut|کاهش کلی و یکسان
trim|کم کردن، هرس کردن
underperforming|کم‌بازده
not a bad shout|فکر بدی نیست (بریتانیایی)
put figures together|عدد و رقم آماده کردن
on your desk by...|تا ... آماده تحویل
revisit|دوباره بررسی کردن
With all due respect...|با کمال احترام...
play devil's advocate|عمداً نظر مخالف مطرح کردن
I'd push back on that.|با این مخالفم (محترمانه)
Correct me if I'm wrong, but...|اگه اشتباه می‌کنم اصلاحم کن، ولی...`,`
I disagree with you.|I can see the logic, but I have some reservations.|ابتدا تأیید، بعد مخالفت؛ الگوی دیپلماتیک.
Your idea is bad.|What if, instead, we...?|پیشنهاد جایگزین به‌جای انتقاد مستقیم.
I will send it soon.|I'll have something on your desk by Thursday.|زمان مشخص اعتماد می‌سازد.`,`
reservations|رِزِرویشِنز|تکیه روی «وی».
what if|وادِف|t نرم در آمریکایی.`,`
پیشنهاد مدیر چیست؟|افزایش بودجه;کاهش سی درصدی بودجه بازاریابی;استخدام|1
راه‌حل جایگزین چیست؟|کاهش کانال‌های کم‌بازده;تعطیلی;تبلیغ بیشتر|0`);

L("C1","📰","بحث درباره‌ی خبرها و موضوعات اجتماعی","درباره‌ی هوش مصنوعی و آینده‌ی شغل‌ها با دوستتان گفتگو می‌کنید.","Priya",`
A|Did you see that article about AI replacing junior developers?|اون مقاله درباره‌ی جایگزینی برنامه‌نویس‌های تازه‌کار با هوش مصنوعی رو دیدی؟
B|Yeah, I skimmed it. Felt a bit alarmist, to be honest.|آره، سرسری خوندمش. راستش یه‌کم ترس‌افکنانه بود.
A|You think? I mean, the writing's kind of on the wall.|فکر می‌کنی؟ یعنی نشونه‌هاش کاملاً پیداست.
B|To an extent, sure. But every big tech shift has created more jobs than it's killed, at least in the long run.|تا حدی، آره. ولی هر تحول بزرگ فناوری، حداقل در بلندمدت، بیشتر از شغلی که از بین برده، شغل ساخته.
A|That's a pretty big "at least," though.|ولی این «حداقل» خیلی بزرگیه.
B|Fair. The transition's gonna be rough for a lot of people, no doubt about it.|قبول. دوران گذار برای خیلیا سخت خواهد بود، شکی نیست.
A|So what's the answer? Just "learn to code"? Kinda ironic now.|پس جوابش چیه؟ فقط «برنامه‌نویسی یاد بگیر»؟ الان یه‌جورایی طنزه.
B|Ha, right? I'd say it's more about adaptability than any one skill.|ها، نه؟ به نظرم بیشتر بحث انعطاف‌پذیریه تا یه مهارت خاص.
A|I'll drink to that.|با این کاملاً موافقم.`,`
I skimmed it.|سرسری خوندمش.
alarmist|ترس‌افکن، اغراق‌آمیز
The writing's on the wall.|نشانه‌ها پیداست (اتفاق بدی در راه است).
to an extent|تا حدی
tech shift|تحول فناوری
in the long run|در بلندمدت
no doubt about it|شکی نیست
ironic|طنزآمیز، متناقض
I'd say...|به نظرم...
adaptability|انعطاف‌پذیری
I'll drink to that.|کاملاً موافقم (اصطلاح)
It's a double-edged sword.|شمشیر دولبه است.
That's a slippery slope.|این سراشیبی خطرناکیه (به پیامدهای بدتر می‌رسه).
Let's not get ahead of ourselves.|عجله نکنیم.
food for thought|موضوعی برای فکر کردن
it's not black and white|سیاه و سفید نیست
I'm torn.|دو دلم.
Take it with a grain of salt.|با احتیاط قبولش کن.`,`
The article was exaggerated.|It felt a bit alarmist.|واژه‌ی دقیق‌تر و پیشرفته‌تر.
I partially agree.|To an extent, sure.|کوتاه و طبیعی.
I agree with you completely.|I'll drink to that.|اصطلاح غیررسمی، حتی بدون نوشیدنی.`,`
to an extent|تو‌اِن اِکستِنت|to ضعیف «تِ».
writing's on the wall|رایدینز آن دِ وال|t نرم آمریکایی.`,`
نظر گوینده‌ی دوم درباره‌ی مقاله چیست؟|کاملاً درست;ترس‌افکنانه;نخوانده|1
به نظرش مهم‌ترین چیز چیست؟|برنامه‌نویسی;انعطاف‌پذیری;مدرک|1`);

L("C1","📝","دادن بازخورد سخت","به یکی از اعضای تیمتان درباره‌ی عملکردش بازخورد می‌دهید.","Ryan",`
B|Thanks for coming in. I wanted to touch base about the last couple of sprints.|ممنون که اومدی. می‌خواستم درباره‌ی دو اسپرینت اخیر هماهنگ کنیم.
A|Sure. Is everything okay?|حتماً. همه چی اوکیه؟
B|Overall, your code quality is great. But I've noticed a few deadlines slipping, and it's starting to affect the team.|در کل کیفیت کدت عالیه. ولی متوجه شدم چندتا ددلاین از دست رفته و داره روی تیم اثر می‌ذاره.
A|Yeah... I know. I've been struggling a bit, to be honest.|آره... می‌دونم. راستش یه‌کم دارم مشکل دارم.
B|I appreciate you being upfront. Is there anything going on that I should know about?|ممنون که رک می‌گی. چیزی هست که باید بدونم؟
A|Just some stuff at home. It's been a lot.|فقط یه سری مسائل خونه. خیلی سنگین بوده.
B|I'm sorry to hear that. Let's figure out how we can take some pressure off.|متأسفم. بیا ببینیم چطور می‌تونیم یه‌کم فشار رو کم کنیم.
A|That would really help.|خیلی کمک می‌کنه.
B|How about we scale back your workload for a few weeks and check in every Monday?|چطوره چند هفته حجم کارت رو کم کنیم و هر دوشنبه یه بررسی کوتاه داشته باشیم؟
A|Thanks. I really appreciate you being so understanding.|ممنون. واقعاً ممنونم که انقدر درک می‌کنی.`,`
touch base|هماهنگ کردن، احوال‌پرسی کاری
Overall...|در کل...
I've noticed...|متوجه شدم...
deadlines slipping|ددلاین‌ها از دست رفتن
affect the team|روی تیم اثر گذاشتن
I've been struggling.|دارم مشکل دارم / سختمه.
upfront|رک و صادق
Is there anything going on?|اتفاقی افتاده؟
It's been a lot.|خیلی سنگین بوده.
figure out|راه‌حل پیدا کردن
take pressure off|فشار را کم کردن
scale back|کاهش دادن
workload|حجم کار
check in|سر زدن، پیگیری کوتاه
understanding|با درک، فهمیده
constructive feedback|بازخورد سازنده
room for improvement|جای پیشرفت
Let's set clear expectations.|بیا انتظارات رو روشن کنیم.`,`
Your work is late and bad.|Overall your code is great, but I've noticed...|مدل «ساندویچ»: نکته‌ی مثبت، مشکل مشخص، راه‌حل.
What is your problem?|Is there anything going on that I should know about?|پرسش باز و همدلانه.
We will reduce your tasks.|How about we scale back your workload?|پیشنهاد به‌جای دستور.`,`
touch base|تاچ بِیس|ch و b جدا و واضح.
I've been struggling|آیوبین استراگلین|I've و been چسبیده، ing → «این».`,`
مشکل رایان چیست؟|کیفیت کد;از دست رفتن ددلاین‌ها;دیر آمدن|1
راه‌حل چیست؟|اخراج;کاهش حجم کار و پیگیری هفتگی;مرخصی|1`);

L("C1","🥂","شبکه‌سازی در رویداد حرفه‌ای","در یک کنفرانس با کسی آشنا می‌شوید و ارتباط می‌سازید.","Grace",`
B|Hi, mind if I join you? I'm Ali, I work in product at a startup.|سلام، اشکالی نداره بهتون ملحق بشم؟ علی هستم، توی یه استارتاپ مدیر محصولم.
A|Not at all! Grace. I'm on the design side over at Spotify.|اصلاً! گریس هستم. سمت طراحی توی اسپاتیفای کار می‌کنم.
B|Oh, cool! I actually caught your talk this morning. The bit on onboarding really resonated.|اِ، چه جالب! راستش صبح سخنرانیت رو دیدم. بخش آن‌بوردینگ خیلی به دلم نشست.
A|Aw, thank you! That's so nice to hear.|آخی، ممنون! شنیدنش خیلی خوشاینده.
B|We're wrestling with a similar problem right now, actually. Our drop-off after day one is brutal.|ما الان دقیقاً با یه مشکل مشابه درگیریم. ریزش کاربر بعد از روز اول خیلی شدیده.
A|Ugh, been there. Happy to pick your brain about it — or let you pick mine.|اَه، تجربه‌ش کردم. خوشحال می‌شم درباره‌ش حرف بزنیم.
B|That'd be amazing. Would you be open to grabbing a virtual coffee sometime next week?|عالی می‌شه. مایلی هفته‌ی بعد یه قهوه‌ی مجازی بزنیم؟
A|For sure. Let's connect on LinkedIn and set something up.|حتماً. توی لینکدین وصل شیم و یه وقت بذاریم.
B|Perfect. I won't keep you — I know everyone wants a piece of you today.|عالیه. بیشتر نگهت نمی‌دارم — می‌دونم امروز همه می‌خوان باهات حرف بزنن.`,`
Mind if I join you?|اشکالی داره بهتون ملحق بشم؟
I work in product.|توی حوزه‌ی محصول کار می‌کنم.
Not at all!|اصلاً، خواهش می‌کنم!
I'm on the design side.|سمت طراحی کار می‌کنم.
I caught your talk.|سخنرانیت رو دیدم.
It really resonated.|خیلی به دلم نشست.
That's so nice to hear.|شنیدنش خیلی خوبه.
wrestling with|درگیر بودن با (مشکل)
drop-off|ریزش (کاربر)
Been there.|تجربه‌ش کردم.
pick someone's brain|از دانش کسی استفاده کردن
Would you be open to...?|مایلی که...؟
grab a virtual coffee|یه گفتگوی آنلاین کوتاه
Let's connect on LinkedIn.|توی لینکدین وصل شیم.
set something up|یه قرار گذاشتن
I won't keep you.|بیشتر وقتت رو نمی‌گیرم.
want a piece of you|همه دنبالتن
What brings you here?|چی باعث شد بیای اینجا؟
It was great chatting with you.|از گپ زدن باهات خوشحال شدم.`,`
Can I sit here?|Mind if I join you?|برای پیوستن به گروه در رویداد.
I liked your speech.|I caught your talk — it really resonated.|تعریف مشخص و صمیمی مؤثرتر است.
Can I ask you some questions?|Would you be open to grabbing a virtual coffee?|درخواست مؤدبانه با فشار کم.`,`
mind if I|مایندِفای|d، if و I به هم وصل.
pick your brain|پیکیور برِین|your ضعیف «یِر».`,`
گریس کجا کار می‌کند؟|گوگل;اسپاتیفای;یک استارتاپ|1
قرار بعدی چیست؟|ناهار حضوری;قهوه‌ی مجازی هفته‌ی بعد;هیچ|1`);
