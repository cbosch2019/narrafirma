import PanelBuilder = require("../panelBuilder/PanelBuilder");
import m = require("mithril");
import valuePathResolver = require("../panelBuilder/valuePathResolver");
import Globals = require("../Globals");
import questionnaireGeneration = require("../questionnaireGeneration");

"use strict";

function add_catalysisReportQuestionChooser(panelBuilder: PanelBuilder, model, fieldSpecification) {
    var project = Globals.project();
    var catalysisReportIdentifier = Globals.clientState().catalysisReportIdentifier();
    if (!catalysisReportIdentifier) return m("div", "Please select a catalysis report");
    
    var prompt = panelBuilder.buildQuestionLabel(fieldSpecification);
    var storageFunction = valuePathResolver.newValuePathForFieldSpecification(model, fieldSpecification);
    var allStories = project.storiesForCatalysisReport(catalysisReportIdentifier, true);
    var allStoryQuestions = project.storyQuestionsForCatalysisReport(catalysisReportIdentifier);
    var elicitingQuestions = project.elicitingQuestionsForCatalysisReport(catalysisReportIdentifier);
    var allParticipantQuestions = project.participantQuestionsForCatalysisReport(catalysisReportIdentifier);

    // if catalysis report has no values for options, initialize it now 
    // I put this here because we assume they will come to this page first after creating the report
    // and I don't know where else to put it
    project.initializeCatalysisReportIfNecessary(catalysisReportIdentifier);

    // annotation questions are not per questionnaire but global to the project (which is maybe not good?)
    // because annotation questions are global, they are not in the form the other questions are in (which are in the questionnaire)
    // so they must be converted
    var allAnnotationQuestions = questionnaireGeneration.convertEditorQuestions(project.collectAllAnnotationQuestions(), "A_");

    // show questions by type
    var nominalQuestionTypes = ["select", "boolean", "checkbox", "checkboxes", "radiobuttons"];

    var storyRatioQuestions = [];
    var storyTextQuestions = [];
    var storyNominalQuestions = [];
    allStoryQuestions.forEach((question) => {
        if (question.displayType === "slider") {
            storyRatioQuestions.push(question);
        } else if (question.displayType === "text" || question.displayType === "textarea") {
            storyTextQuestions.push(question);
        } else if (nominalQuestionTypes.indexOf(question.displayType) !== -1)  {
            storyNominalQuestions.push(question);
        }
    });

    var participantRatioQuestions = [];
    var participantTextQuestions = [];
    var participantNominalQuestions = [];
    allParticipantQuestions.forEach((question) => {
        if (question.displayType === "slider") {
            participantRatioQuestions.push(question);
        } else if (question.displayType === "text" || question.displayType === "textarea") {
            participantTextQuestions.push(question);
        } else if (nominalQuestionTypes.indexOf(question.displayType) !== -1)  {
            participantNominalQuestions.push(question);
        }
    });
    
    function isChecked(shortName, value = undefined) {
        var map = storageFunction() || {};
        if (map === undefined) {
            return false;
        }
        if (value === undefined) {
            return !!map[shortName];
        }
        map[shortName] = !!value;
        storageFunction(map);
    }
    
    function increment(theObject, fieldName) {
        var count = theObject[fieldName] || 0;
        count++;
        theObject[fieldName] = count;
    }
    
    function bin(value) {
        var bin = Math.floor(value / 10);
        var high = bin * 10 + 9;
        if (bin >= 9) {
            bin = 9;
            high = 100;
        }
        var low = bin * 10;
        return "" + low + " - " + high;
    }
    
    function countAnswers(id, questionType) {
        var answerCounts = {};
        var answeredQuestionsCount = 0;
        var naCount = 0;
        allStories.forEach((story) => {
            var value = story.fieldValue(id);
            if (questionType == "boolean") {
                if (value) {
                    increment(answerCounts, "yes");
                } else {
                    increment(answerCounts, "no");
                }
                answeredQuestionsCount++;
            } else if (questionType == "checkbox") {
                if (value) {
                    increment(answerCounts, "true");
                } else {
                    increment(answerCounts, "false");
                }
                answeredQuestionsCount++;
            } else if (value !== undefined && value !== null && value !== {} && value !== "") {
                answeredQuestionsCount++;
                if (questionType === "slider") {
                    // Bin the sliders
                    increment(answerCounts, bin(value));
                } else if (typeof value === "string" || typeof value === "number") {
                    increment(answerCounts, value);
                } else {
                    for (var key in value) {
                        if (value[key]) {
                            increment(answerCounts, key);
                        }                   
                    }
                }
            } else {
                naCount++;
            }
        });
        if (naCount) answerCounts["{N/A}"] = naCount;
        
        var sortedAnswerCounts = {};
        Object.keys(answerCounts).sort().forEach((key) => {
            sortedAnswerCounts[key] = answerCounts[key];
        });
        
        return {
            answeredQuestionsCount: answeredQuestionsCount,
            answerCounts: sortedAnswerCounts
        };
    }
    
    function buildQuestionCheckbox(shortName, questionType, questionCategory): any {
        var id = questionCategory + shortName;
        // now including text questions
        if (questionType === "label" || (questionType === "header")) return [];
        
        // if (questionType === "textarea" || (questionCategory !== "A_" && questionType === "text")) return [];
        var counts = countAnswers(id, questionType);
        var answersHover = shortName + " (" + questionType + ") has " + counts.answeredQuestionsCount + " answers:\n" + JSON.stringify(counts.answerCounts, null, 2);
        
        return m("div", {title: answersHover}, [
            m("input[type=checkbox]", {id: id, checked: isChecked(id), onchange: function(event) { isChecked(id, event.target.checked); }}),
            m("label", {"for": id}, shortName),
            m("br")
            /*
            "^--- ",
            counts.answeredQuestionsCount,
            " answers: ",
            JSON.stringify(counts.answerCounts, null, 2),
            m("br"),
            m("br")
            */
        ]);
    }
    
    function buildQuestionCheckboxSpecialForElicitingQuestion(): any {
        var id = "elicitingQuestion";
        var counts = countAnswers(id, "select");
        var answersHover = id + " has " + counts.answeredQuestionsCount + " answers:\n" + JSON.stringify(counts.answerCounts, null, 2);
        
        return m("div", {title: answersHover}, [
            m("input[type=checkbox]", {id: id, checked: isChecked(id), onchange: function(event) { isChecked(id, event.target.checked); }}),
            m("label", {"for": id}, "Eliciting question"),
            m("br")
        ]);
    }
    
    function buildQuestionCheckboxSpecialForNumStoriesTold(): any {
        var id = "numStoriesTold";
        var counts = countAnswers(id, "select");
        var answersHover = id + " has " + counts.answeredQuestionsCount + " answers:\n" + JSON.stringify(counts.answerCounts, null, 2);
        
        return m("div", {title: answersHover}, [
            m("input[type=checkbox]", {id: id, checked: isChecked(id), onchange: function(event) { isChecked(id, event.target.checked); }}),
            m("label", {"for": id}, "Number of stories told"),
            m("br")
        ]);
    }
    
    function buildQuestionCheckboxSpecialForStoryLength(): any {
        var id = "storyLength";
        
        return m("div", [
            m("input[type=checkbox]", {id: id, checked: isChecked(id), onchange: function(event) { isChecked(id, event.target.checked); }}),
            m("label", {"for": id}, "Story length"),
            m("br")
        ]);
    }

    function selectAll() {
        var map = {};
        elicitingQuestions.forEach((question) => {
            map["elicitingQuestion"] = true;
        });
        allStoryQuestions.forEach((question) => {
            map["S_" + question.displayName] = true;
        });
        allParticipantQuestions.forEach((question) => {
            map["P_" + question.displayName] = true;
        });
        allAnnotationQuestions.forEach((question) => {
            map["A_" + question.displayName] = true;
        });
        map["numStoriesTold"] = true;
        map["storyLength"] = true;
        storageFunction(map);
    }

    function numBoxesChecked() {
        const map = storageFunction();
        let result = 0;
        if (map) {
            Object.keys(map).forEach( function(item) {
                if (map[item]) result ++;
            });
        }
        return result;
    }

    function selectAllStoryQuestions() {
        var map = {};
        allStoryQuestions.forEach((question) => {
            map["S_" + question.displayName] = true;
        });
        storageFunction(map);
    }
    
    function selectAllParticipantQuestions() {
        var map = {};
        allParticipantQuestions.forEach((question) => {
            map["P_" + question.displayName] = true;
        });
        storageFunction(map);
    }
    
    function clearAll() {
        storageFunction({});
    }
    
    // TODO: Translate
    return m("div.questionExternal", [
        prompt,
        m("div", [
            m("br"),  
            m("b", "Story questions"),
            m("br"),  
            m("br"),

            m("i", "Scales"),
            storyRatioQuestions.length ? m("br") : "",
            storyRatioQuestions.length ? m("br") : "",
            storyRatioQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "S_");
            }),
            storyRatioQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("i", "Choices"),
            storyNominalQuestions.length ? m("br") : "",
            storyNominalQuestions.length ? m("br") : "",
            storyNominalQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "S_");
            }),
            storyNominalQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("i", "Texts"),
            storyTextQuestions.length ? m("br") : "",
            storyTextQuestions.length ? m("br") : "",
            storyTextQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "S_");
            }),
            storyTextQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("b", "Participant questions"),
            m("br"),
            m("br"),

            m("i", "Scales"),
            participantRatioQuestions.length ? m("br") : "",
            participantRatioQuestions.length ? m("br") : "",
            participantRatioQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "P_");
            }),
            participantRatioQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("i", "Choices"),
            participantNominalQuestions.length ? m("br") : "",
            participantNominalQuestions.length ? m("br") : "",
            participantNominalQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "P_");
            }),
            participantNominalQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("i", "Texts"),
            participantTextQuestions.length ? m("br") : "",
            participantTextQuestions.length ? m("br") : "",
            participantTextQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "P_");
            }),
            participantTextQuestions.length ? [] : [m("i", " - none"), m("br")],

            m("br"),
            m("b", "Annotation questions"), 
            allAnnotationQuestions.length ? m("br") : "",
            allAnnotationQuestions.length ? m("br") : "",
            allAnnotationQuestions.map((question) => {
                return buildQuestionCheckbox(question.displayName, question.displayType, "A_");
            }),
            allAnnotationQuestions.length ? [] : [m("i", " - none"), m("br")],
            m("br"),
            m("b", "Additional information"),
            m("br"),
            m("br"),
            elicitingQuestions.map((question) => {
                return buildQuestionCheckboxSpecialForElicitingQuestion();
            }),
            buildQuestionCheckboxSpecialForNumStoriesTold(),
            buildQuestionCheckboxSpecialForStoryLength(),
        ]),
    m("br"),
    m("button", { onclick: selectAll }, "Select all"),
    m("button", { onclick: selectAllStoryQuestions }, "Select only story questions"),
    m("button", { onclick: selectAllParticipantQuestions }, "Select only participant questions"),
    m("button", { onclick: clearAll }, "Clear all"),
    m("br"),
    m("br"),
    m("div[style=margin-left:1em]", ["" + numBoxesChecked() + " questions selected; " + allStories.length + " stories"]),
    m("br")
    ]);
}

export = add_catalysisReportQuestionChooser;
