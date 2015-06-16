import kludgeForUseStrict = require("../kludgeForUseStrict");
"use strict";

function add_questionsTable(panelBuilder, contentPane, model, fieldSpecification) {
    var questionContentPane = panelBuilder.createQuestionContentPaneWithPrompt(contentPane, fieldSpecification);
    
    var label = panelBuilder.newContentPane({
        // content: translate(id + "::prompt", fieldSpecification.displayPrompt)
        content: "<b>UNFINISHED add_questionsTable: " + fieldSpecification.id + "</b>"             
    });
    label.placeAt(questionContentPane);
    return label;
}

export = add_questionsTable;
