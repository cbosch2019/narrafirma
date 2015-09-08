import kludgeForUseStrict = require("../../kludgeForUseStrict");
"use strict";

var panel: Panel = {
    id: "page_reviewIncomingStories",
    displayName: "Review incoming stories",
    displayType: "page",
    section: "collection",
    modelClass: "ReviewIncomingStoriesActivity",
    panelFields: [
        {
            id: "collectedStoriesDuringCollectionLabel",
            valueType: "none",
            displayType: "label",
            displayPrompt: "On this page you can see your <strong>collected stories</strong> as they come in."
        },
        {
            id: "storyCollectionChoiceX",
            valuePath: "/clientState/storyCollectionIdentifier",
            valueType: "string",
            valueOptions: "project_storyCollections",
            valueOptionsSubfield: "storyCollection_shortName",
            required: true,
            displayType: "select",
            displayName: "Story collection",
            displayPrompt: "Choose a <strong>story collection</strong> to review."
        },
        {
            id: "webStoryCollection_collectedStoriesDuringCollection",
            valuePath: "/clientState/storyCollectionIdentifier",
            valueType: "none",
            displayType: "storyBrowser",
            displayPrompt: "Collected stories"
        }
    ]
};

export = panel;
