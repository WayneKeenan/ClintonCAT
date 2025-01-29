# Clinton CAT

Browser Extension that shows articles  
from the **[CAT Wiki]** for pages you visit.

*CAT : Consumer Action Taskforce*

<br/>

## What it does

Currently if you visit a website that has been  
referenced on the wiki, a new tab will open in  
the background with the corresponding article.

*Except for pages you have manually excluded.*

<br/>

## Installation

Currently the extension has to be manually installed.

1.  Download a **[Release]**  
    *or clone the repository*

2.  Unzip the contents of the download

<br/>

### Chromium

3.  Open the extension settings:  
    Chromium : `chrome://extensions/`  
    Brave : `brave://extensions/`

4. Enable `Developer Mode`

5. Click <kbd> Load Unpacked </kbd>

6. Select the unzipped folder

<br/>

### Firefox / Librewolf

3. Navigate to `about:debugging#/runtime/this-firefox`

4. Click <kbd> Load Temporary Add-on... </kbd>

5. Select the `manifest.json` in the unzipped download

<br/>

### Unstable Version

Until this extension has been published to the  
various extension stores, the `main` branch of  
this repository should be the most stable.

Active development is happens on the `dev` branch.

<br/>

## Work In Progress

- [ ] Platform: Safari Extension
- [ ] UI: Alternate notification strategy: overlay button in-page header
- [ ] User Config: Preferred notification strategy
- [ ] Logic: Extending the trailing TLD list
- [ ] Logic: More accurate Wiki search (e.g. only display pages with 'Controversies')

<br/>

## Contributions

Thank you to the following people as  
well as everyone else that has helped:

-   [@blimeybloke]  
    *Settings and whitelisting*
-   [@lnardon]  
    *Firefox Support*
-   [@khonkhortisan]  
    *Firefox Support*
-   [@SalimOfShadow]  
    *Multiple tab prevention*
-   [@EricFrancis12]  
    *On / Off Toggle*



[CAT Wiki]: https://wiki.rossmanngroup.com/wiki/Mission_statement
[Release]: https://github.com/WayneKeenan/ClintonCAT/releases


[@khonkhortisan]: https://github.com/khonkhortisan
[@SalimOfShadow]: https://github.com/SalimOfShadow
[@EricFrancis12]: https://github.com/EricFrancis12
[@blimeybloke]: https://github.com/blimeybloke
[@lnardon]: https://github.com/lnardon
