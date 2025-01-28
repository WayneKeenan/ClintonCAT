# Clinton CAT

## About

Chrome Browser Extension for automatically searching [Rossmann's Consumer Action Taskforce (CAT)](https://wiki.rossmanngroup.com/wiki/Mission_statement) articles for the current site being visited. 

## Operation

If a CAT wiki page for the domain is found then a new tab is opened in the background for the wiki article.

## Install

As this is not yet on the Chrome Web Store it's necessary to download and manually install it: 

1. Clone this repo or download a [release](https://github.com/WayneKeenan/ClintonCAT/releases) (recommended). 
2. Open Extension settings: e.g. `chrome://extensions/`  or `brave://extensions/` etc.  (see below for Firefox)
3. Enable Developer Mode
4. Click `Load Unpacked`
5. Navigate to the cloned/unzipped folder.


### Firefox

 
about:addons -> Extensions -> 'Settings icon' -> Debug Addons -> Load Temporary Add-on... -> Open `ClintonCAT/manifest.json`



### Bleeding edge version

The 'main' branch should be the most stable one of the family to install, until it's on the various extension 'web stores'.

The most recent bleeding edge version will be the `dev` branch.


## TODO

- [ ] Platform: Safari Extension
- [ ] UI: Alternate notification strategy: overlay button in-page header
- [ ] User Config: Preferred notification strategy
- [ ] Logic: Extending the trailing TLD list
- [ ] Logic: More accurate Wiki search (e.g. only display pages with 'Controversies')

# Contributions

Thanks to:

- @blimeybloke  (Settings and whitelisting)
- @lnardon (Firefox)
- @khonkhortisan (Firefox)
- @SalimOfShadow (Multiple tab prevention)
- @EricFrancis12 (Toggle on/off)
