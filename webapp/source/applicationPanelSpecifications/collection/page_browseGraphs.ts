import kludgeForUseStrict = require("../../kludgeForUseStrict");
"use strict";

var panel: Panel = {
    id: "page_browseGraphs",
    displayName: "Spot-check graphs",
    displayType: "page",
    section: "collection",
    modelClass: "BrowseGraphsActivity",
    panelFields: [
        {
            id: "graphBrowserLabel",
            valueType: "none",
            displayType: "label",
            displayPrompt: "On this page you can take a preliminary look at <strong>patterns</strong> in the answers people gave about their incoming stories. (This page is intended mainly to spot check for issues related to the story form design. You can review your graphs more systematically in the catalysis section.)"
        },
        {
            id: "storyCollectionChoiceY",
            valuePath: "/clientState/storyCollectionIdentifier",
            valueType: "string",
            valueOptions: "project_storyCollections",
            valueOptionsSubfield: "storyCollection_shortName",
            required: true,
            displayType: "select",
            displayName: "Story collection",
            displayPrompt: "Choose a <strong>story collection</strong> whose graphs you want to check."
        },
        {
            id: "graphBrowserDisplay",
            valuePath: "/clientState/storyCollectionIdentifier",
            valueType: "none",
            displayType: "graphBrowser",
            displayPrompt: "Choose one or two <strong>questions</strong> to explore."
        }
    ]
};

export = panel;
