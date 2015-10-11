import Globals = require("./Globals");
import dialogSupport = require("./panelBuilder/dialogSupport");

// Library for saving files, imported by narrafirma.html
declare var saveAs;

var allMessagesExportType = "NarraFirma_allMessages";
var allMessagesExportFormat = "0.1.0";

var currentProjectStateExportType = "NarraFirma_currentProjectState";
var currentProjectStateExportFormat = "0.1.0";

export function exportEntireProject() {
    if (!confirm("Export entire project?\n(This may take a while.)")) return;
    
    var project = Globals.project();
    
    // var json = JSON.stringify(project.tripleStore.tripleMessages, null, 4);
    var exportObject =  {
        projectIdentifier: project.projectIdentifier,
        timestamp: new Date().toISOString(),
        exportType: allMessagesExportType,
        exportFormat: allMessagesExportFormat,
        userIdentifier: project.pointrelClient.userIdentifier,
        messages: project.pointrelClient.messagesSortedByReceivedTimeArray
    };
    
    var json = JSON.stringify(exportObject, null, 4);
    
    // var printItems = m("pre", json);
    // var htmlForPage = generateHTMLForPage("NarraFirma project export for " + project.projectIdentifier + " on " + new Date().toISOString(), null, printItems);
    // printHTML(htmlForPage);
    
    var questionnaireBlob = new Blob([json], {type: "application/json;charset=utf-8"});
    saveAs(questionnaireBlob, exportObject.projectIdentifier + " exported at " + exportObject.timestamp + ".json");
}

function chooseProjectFileToImport(callback) {
    // console.log("chooseFileToImport");
    var projectFileUploader = <HTMLInputElement>document.getElementById("projectFileUploader");
    // console.log("cvsFileUploader", cvsFileUploader);
    projectFileUploader.onchange = function() {
        var file = projectFileUploader.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e: Event) {
            var contents = (<FileReader>e.target).result;
            callback(contents);
        };
        reader.readAsText(file);
    };
    projectFileUploader.click();
}

export function importEntireProject() {
    var project = Globals.project();
    
    if (!confirm("Import entire project?")) return;
    
    console.log("importEntireProject");
    chooseProjectFileToImport((contents) => {
        // console.log("contents", contents);
        var importObject = JSON.parse(contents);
        // importObject.messages.forEach((message) => {
        //    // if (message._topicIdentifier === "surveyResults")
        //    console.log("message", message._topicIdentifier);
        //});
        
        // TODO: Similar to what is in csvImportExport -- could any duplication be refactored out?
        
        if (importObject.exportType !== allMessagesExportType) {
            alert('Wrong export file type; expected exportType of "' + allMessagesExportType + '" but found: "' + importObject.exportType + '"');
            return;
        }
        
        if (importObject.exportFormat > allMessagesExportFormat) {
            if (!confirm("The file has an export format of: " + importObject.exportFormat + " which is later than this application's of: " + allMessagesExportFormat + "\nTry importing anyway (not recommended)?")) {
                return;
            }
        }
        
        var progressModel = dialogSupport.openProgressDialog("Importing project messages...", "Progress importing project messsages", "Cancel", dialogCancelled);
  
        function dialogCancelled(dialogConfiguration, hideDialogMethod) {
            progressModel.cancelled = true;
            hideDialogMethod();
        }
        
        var messageIndexToSend = 0;
    
        function sendNextMessage() {
            // console.log("sendNextMessage", messageIndexToSend);
            if (progressModel.cancelled) {
                alert("Cancelled after importing " + messageIndexToSend + " messages");
            } else if (messageIndexToSend >= importObject.messages.length) {
                alert("Done importing messages");
                progressModel.hideDialogMethod();
                progressModel.redraw();
            } else {
                var message = importObject.messages[messageIndexToSend++];
                
                // Rewrite project references in triples, but not in survey results
                // TODO: The message trace is no longer valid if do rewrite
                if (message.change && message.change.triple && message.change.triple.a === importObject.projectIdentifier) {
                    message.change.triple.a = project.projectIdentifier;
                }
                if (message.change && message.change.projectIdentifier  === importObject.projectIdentifier) {
                    message.change.projectIdentifier = project.projectIdentifier;
                }                
                
                // TODO: Translate
                progressModel.progressText = "Importing " + messageIndexToSend + " of " + importObject.messages.length + " messages";
                progressModel.redraw();
                setTimeout(function() { project.pointrelClient.sendMessage(message, sendNextMessage); }, 0);
            }
        }
        
        // Start sending project messages
        sendNextMessage();
    });
}

export function exportProjectCurrentState() {
    if (!confirm("Export current state of project?")) return;
    
    var project = Globals.project();
    var tripleStore = project.tripleStore;
    
    var projectCurrentState = {};
    
    var aKeys = Object.keys(tripleStore.indexABC);
    // console.log("aKeys", aKeys);
    aKeys.sort();
    for (var aKeyIndex = 0; aKeyIndex < aKeys.length; aKeyIndex++) {
        var aKey = aKeys[aKeyIndex];
        // console.log("aKey", aKey);
        var aObject = tripleStore.indexABC[aKey];
        // console.log("aObject", aObject);
        var bResult = {};
        projectCurrentState[aKey] = bResult;
        var bKeys = Object.keys(aObject);
        bKeys.sort();
        // console.log("bKeys", bKeys);
        for (var bKeyIndex = 0; bKeyIndex < bKeys.length; bKeyIndex++) {
            var bKey = bKeys[bKeyIndex];
            bResult[bKey] = aObject[bKey].latestC;
        }
    }
    
    // console.log("exportProjectCurrentState", projectCurrentState);
    
    var exportObject =  {
        projectIdentifier: project.projectIdentifier,
        timestamp: new Date().toISOString(),
        exportType: currentProjectStateExportType,
        exportFormat: currentProjectStateExportFormat,
        userIdentifier: project.pointrelClient.userIdentifier,
        projectCurrentState: projectCurrentState
    };
    
    var json = JSON.stringify(exportObject, null, 4);
    
    var questionnaireBlob = new Blob([json], {type: "application/json;charset=utf-8"});
    saveAs(questionnaireBlob, exportObject.projectIdentifier + " current state exported at " + exportObject.timestamp + ".json");
}

export function importProjectCurrentState() {
    var project = Globals.project();
    
    if (!confirm("Import current project state?\n(This should ideally only be done with a new empty project.)")) return;
  
    console.log("importProjectCurrentState");
    chooseProjectFileToImport((contents) => {
        // console.log("contents", contents);
        var importObject = JSON.parse(contents);
        // importObject.messages.forEach((message) => {
        //    // if (message._topicIdentifier === "surveyResults")
        //    console.log("message", message._topicIdentifier);
        //});
        
        // TODO: Similar to what is in csvImportExport -- could any duplication be refactored out?
        
        if (importObject.exportType !== currentProjectStateExportType) {
            alert('Wrong export file type; expected exportType of "' + currentProjectStateExportType + '" but found: "' + importObject.exportType + '"');
            return;
        }
        
        if (importObject.exportFormat > currentProjectStateExportFormat) {
            if (!confirm("The file has an export format of: " + importObject.exportFormat + " which is later than this application's of: " + allMessagesExportFormat + "\nTry importing anyway (not recommended)?")) {
                return;
            }
        }
        
        var progressModel = dialogSupport.openProgressDialog("Importing current project state...", "Progress importing current project state", "Cancel", dialogCancelled);
  
        function dialogCancelled(dialogConfiguration, hideDialogMethod) {
            progressModel.cancelled = true;
            hideDialogMethod();
        }
        
        var triplesToAdd = [];
        
        // Prepare triples for adding
        var aKeys = Object.keys(importObject.projectCurrentState);
        // console.log("aKeys", aKeys);
        for (var aKeyIndex = 0; aKeyIndex < aKeys.length; aKeyIndex++) {
            var aKey = aKeys[aKeyIndex];
            var aKeyObject = JSON.parse(aKey);
            var aObject = importObject.projectCurrentState[aKey];
            // console.log("aKey", aKey);
            // console.log("aObject", aObject);
            // Rewrite project references in triples
            if (aKeyObject === importObject.projectIdentifier) {
                aKeyObject = project.projectIdentifier;
            }
            
            var bKeys = Object.keys(aObject);
            // console.log("bKeys", bKeys);
            for (var bKeyIndex = 0; bKeyIndex < bKeys.length; bKeyIndex++) {
                var bKey = bKeys[bKeyIndex];
                var bKeyObject = JSON.parse(bKey);
                var cValue = aObject[bKey];
                triplesToAdd.push([aKeyObject, bKeyObject, cValue]);
            }
        }
        
        var triplesAddedCount = 0;
        
        // console.log("triplesToAdd", triplesToAdd);
 
        function sendNextMessage() {
            // console.log("sendNextMessage", messageIndexToSend);
            if (progressModel.cancelled) {
                alert("Cancelled after adding " + triplesAddedCount + " triples");
            } else if (triplesAddedCount >= triplesToAdd.length) {
                alert("Done importing triples");
                progressModel.hideDialogMethod();
                progressModel.redraw();
            } else {
                var triple = triplesToAdd[triplesAddedCount++];
                
                // TODO: Translate
                progressModel.progressText = "Sending " + triplesAddedCount + " of " + triplesToAdd.length + " triples";
                progressModel.redraw();
                setTimeout(function() { project.tripleStore.addTriple(triple[0], triple[1], triple[2], sendNextMessage); }, 0);
            }
        }
        
        // Start sending project messages
        sendNextMessage();
    });
}
