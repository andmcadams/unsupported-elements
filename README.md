Have you ever thought "Wow I really wish I could use some of the unsupported elements I see on MDN"? Hopefully not, but if you have, this is some code that allows you to use some of them (kind of).

Not a huge fan of custom elements requiring a hyphen since it sort of ruins the charm. So this allows you to use them without hyphens! Just throw `<blink>...</blink>` in your html. It's probably not very performant, but if you are using this you probably don't care.

# bgsound
Plays a background sound! Unfortunately this can't really work as it did in IE (and maybe Opera?) since browsers are now a little smarter and won't let you autoplay unmuted sounds. Shame.
## Attributes
* src: string
* balance: int [-10000, 10000] (default 0)
* loop: int | 'infinite' (default 'infinite')
* volume: int [-10000, 0] (default 0)

# blink
Just throw things in here I suppose. They'll blink. I didn't really look at the documentation much longer than I needed to yoink [the polyfill from mdn](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink#css_polyfill).