//add styling, full screen vs. small screen,
//add info and dialog boxes
//instructions to close settings
//error on home page screen
//add error messages for disabled buttons

//check permissions - commenter and read-only can generate chart (but not save?), add option?, find way to check permissions to stop save/generate
//test errors for load seating chart
//test errors for new seating chart
//test render chart with bad values
//check save with 50+ records (check can't get to save if commenter/readonly) - need to check permission separately?
//when change table problems happen

//remove allow pick none
//add comments

//seating chart automation - put into array, shuffle and check for relationships (overall happiness?)
//get save to return to finish screen (and hide Chart Name problem) - set save data false when chart name problem (check others)
//editing seating chart after the fact?

//optimize loops/algorithms (check variable declaration in loops)
//add loading icons?
//non-linked guest name option?
//remember current unsaved generated chart?
//restrict to at least 2 guests

//primary, secondary button variants?


import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    settingsButton,
    useSettingsButton,
    useLoadable,
    useWatchable,
    SwitchSynced,
    Loader,
    Tooltip,
    TablePickerSynced,
    Input,
    InputSynced,
    Label,
    FormField,
    FieldPickerSynced,
    Button,
    Select,
} from '@airtable/blocks/ui';
import { FieldType } from '@airtable/blocks/models'
import React, {useState, useEffect} from 'react';

function SeatingChartBlock() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    });

    const [showNewChart, setShowNewChart] = useState(false);
    const [loadExistingChart, setLoadExistingChart] = useState(false);

    // show settings
    if (isShowingSettings) {
        return <SettingsComponent />;

    // show block options screen
    } else if (!showNewChart && !loadExistingChart) {
        return <div>
            <Button onClick={() => setShowNewChart(true)} icon="cog">
                Create a New Seating Chart
            </Button>

            <Button onClick={() => setLoadExistingChart(true)} icon="download">
                Load an Existing Seating Chart
            </Button>
        </div>;

    // show new seating chart screen
    } else if (showNewChart && !loadExistingChart) {
        return <NewSeatingChart />;

    // show load existing seating chart screen
    } else if (loadExistingChart && !showNewChart) {
        return <LoadExistingSeatingChart />;

    // error page
    } else {
        return <div>ERROR, try refreshing the page.</div>;
    }
}

// settings component
function SettingsComponent() {

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const dataTable = base.getTableByIdIfExists(dataTableId);

    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const commenterGenerateChart = globalConfig.get('commenterGenerateChart');
    const readOnlyGenerateChart = globalConfig.get('readOnlyGenerateChart');

    return <div>
        <Label htmlFor="commenter-generate-chart">Do you want commenters to be able to generate charts? They won't be able to save them.</Label>
        <SwitchSynced id="commenter-generate-chart" globalConfigKey="commenterGenerateChart" />

        <Label htmlFor="read-only-generate-chart">Do you want read-only users to be able to generate charts? They won't be able to save them.</Label>
        <SwitchSynced id="read-only-generate-chart" globalConfigKey="readOnlyGenerateChart" />

        <Label htmlFor="data-table-picker">Select table to store seating chart data</Label>
        <TablePickerSynced id="data-table-picker" globalConfigKey="dataTableId" />

        // check is text field
        <Label htmlFor="chart-name-field-picker">Select field that contains the seating chart name</Label>
        <FieldPickerSynced id="chart-name-field-picker" table={dataTable} allowedTypes={FieldType.TEXT} globalConfigKey="chartNameFieldId" />

        //check unique and that is lookup?
        <Label htmlFor="guest-name-field-picker">Select field that contains the guest lookup field</Label>
        <FieldPickerSynced id="guest-name-field-picker" table={dataTable} globalConfigKey="guestNameFieldId" />

        <Label htmlFor="table-num-field-picker">Select field that contains the table number</Label>
        <FieldPickerSynced id="table-num-field-picker" table={dataTable} allowedTypes={[FieldType.NUMBER]} globalConfigKey="tableNumFieldId" />

        <Label htmlFor="chair-num-field-picker">Select field that contains the chair number</Label>
        <FieldPickerSynced id="chair-num-field-picker" shouldAllowPickingNone={true} allowedTypes={[FieldType.NUMBER]} table={dataTable} globalConfigKey="chairNumFieldId" />

    </div>;
}

// new seating chart component

function NewSeatingChart() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

    const base = useBase();
    const globalConfig = useGlobalConfig();

    const guestTableId = globalConfig.get('guestTableId');
    const relationshipFieldId = globalConfig.get('relationshipFieldId');
    const originalGuestNameFieldId = globalConfig.get('originalGuestNameFieldId');

    const commenterGenerateChart = globalConfig.get('commenterGenerateChart');
    const readOnlyGenerateChart = globalConfig.get('readOnlyGenerateChart');

    const guestTable = base.getTableByIdIfExists(guestTableId);

    const numTables = globalConfig.get('numTables');
    const numChairs = globalConfig.get('numChairs');

    // disable Generate Seating Chart button until fields are filled
    const buttonDisabled = numTables <= 0 || numTables == null || numChairs <= 0 ||  numChairs == null || guestTable == null || relationshipFieldId == null || originalGuestNameFieldId == null || generateChart;

    // note if number of guests exceeds capacity given
    var errorMessage = "";

    var records = useRecords(guestTable, {fields: [relationshipFieldId, originalGuestNameFieldId]});

    if (records.length <= 1) {
        errorMessage = "You must have at least two people on your list to create a seating chart.";
    } else if (!buttonDisabled && numTables != null && numChairs != null && records.length > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list."
    }

    const [generateChart, setGenerateChart] = useState(false);

    var chart;
    var finalRecords;
    var nameOnlyFinalRecords = [];

    const linkedRecordQueries = records.map(
        record => record.selectLinkedRecordsFromCell(relationshipFieldId),
    );

    useLoadable(linkedRecordQueries);
    useWatchable(linkedRecordQueries, ['records', 'cellValues']);

    if (generateChart) {

        finalRecords = seatingAutomation(records, linkedRecordQueries, numTables, numChairs, relationshipFieldId);

        for (var k = 0; k < finalRecords.length; k++) {
            if (finalRecords[k] != "") {
                nameOnlyFinalRecords.push(finalRecords[k].getCellValueAsString(originalGuestNameFieldId));
            } else {
                nameOnlyFinalRecords.push("");
            }
        }

        chart = renderSeatingChart(nameOnlyFinalRecords, numTables, numChairs);

    }

    const [saveChartData, setSaveChartData] = useState(false);
    const [showHomeScreen, setHomeScreen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />;
    } else if (saveChartData) {
        return <SaveSeatingChartData records={finalRecords} numChairs={numChairs} numTables={numTables} chart={chart} />;
    } else {

        return <div>
            <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>

            <Label htmlFor="guest-table-picker">Select table that contains guest data</Label>
            <TablePickerSynced id="guest-table-picker" globalConfigKey="guestTableId" />

            <Label htmlFor="original-guest-name-field-picker">Select field that contains the name for each guest</Label>
            <FieldPickerSynced id="original-guest-name-field-picker" table={guestTable} globalConfigKey="originalGuestNameFieldId" />

            <Label htmlFor="relationship-field-picker">Select field that contains relationship data for each guest</Label>
            <FieldPickerSynced id="relationship-field-picker" table={guestTable} globalConfigKey="relationshipFieldId" />

            <FormField label="Number of Tables">
                <InputSynced type="number" min="1" required={true} globalConfigKey="numTables" />
            </FormField>

            <FormField label="Number of Chairs">
                <InputSynced required={true} min="1" type="number" globalConfigKey="numChairs" />
            </FormField>

            {errorMessage}

            {!generateChart && <Button onClick={e => setGenerateChart(true)} disabled={buttonDisabled} icon="personalAuto" variant="primary">
                Generate Seating Chart
            </Button>}

            {generateChart && chart}

            {generateChart && <Button onClick={() => setSaveChartData(true)} variant="primary" icon="upload">
                Store Data
            </Button>}
        </div>;
    }
}

// load existing seating chart component

function LoadExistingSeatingChart() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const dataTable = base.getTableByIdIfExists(dataTableId);
    const chartNameField = dataTable.getFieldByIdIfExists(chartNameFieldId);

    const sortOptions = {
        sorts: [
            {field: chartNameFieldId, direction: 'asc'},
            {field: tableNumFieldId, direction: 'asc'},
            {field: chairNumFieldId, direction: 'asc'},
        ],
        fields: [
            guestNameFieldId,
            chartNameFieldId,
            tableNumFieldId,
            chairNumFieldId,
        ]
    };

    const records = useRecords(dataTable, sortOptions, {fields: [chartNameFieldId, tableNumFieldId, chairNumFieldId, guestNameFieldId]});

    const [chartName, setChartName] = useState("");

    var buttonDisabled = true;

    if (chartName == "" || chartName == null) {

    } else {
        buttonDisabled = false;
    }

    const [renderChart, setRenderChart] = useState(false);

    var chart;
    var errorMessage = "";

    if (renderChart) {
        var maxTableNum = 0;
        var maxChairNum = 0;

        var guestNameArray = [];
        var filteredArray = [];

        for (var i = 0; i < records.length; i++) {

            if (records[i].getCellValue(chartNameFieldId) == chartName) {

                filteredArray.push(records[i]);

                if (records[i].getCellValue(tableNumFieldId) > maxTableNum) {
                    maxTableNum = records[i].getCellValue(tableNumFieldId);
                }

                if (records[i].getCellValue(chairNumFieldId) > maxChairNum) {
                    maxChairNum = records[i].getCellValue(chairNumFieldId);
                }
            }
        }

        var name = "";

        for (var j = 0; j < maxTableNum * maxChairNum; j++) {

            for (var k = 0; k < filteredArray.length; k++) {

                if (filteredArray[k].getCellValue(tableNumFieldId) == (Math.floor(j / maxChairNum) + 1) && filteredArray[k].getCellValue(chairNumFieldId) == ((j % maxChairNum) + 1)) {
                    name = filteredArray[k].getCellValueAsString(guestNameFieldId);
                    break;
                }
            }

            guestNameArray.push(name);
            name = "";
        }

        if (filteredArray.length == 0 || maxChairNum == 0 || maxTableNum == 0) {
            errorMessage = "That chart could not be found. Please try a different name.";
        } else {

            chart = renderSeatingChart(guestNameArray, maxTableNum, maxChairNum);
        }

    }

    const [showHomeScreen, setHomeScreen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />
    } else if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>
            Before proceeding with loading saved data you must fill out some information.
            <SettingsComponent />

            </div>;
    } else {
        return <div>
            <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>

            <FormField label="Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            <Button onClick={e => setRenderChart(true)} disabled={buttonDisabled} icon="download" variant="primary">
                Load Chart
            </Button>

            {renderChart && errorMessage}

            {renderChart && <div>{chart}</div>}

        </div>;
    }

}

// Seating chart automatic creation function

function seatingAutomation(records, linkedRecordQueries, numTables, numChairs, relationshipFieldId) {

    var maxTimes = 50;
    var currentTimes = 0;

    var finalRecords = [];

    for (var i = 0; i < numTables * numChairs; i++) {
        if (records[i] != null) {
            finalRecords.push(records[i]);
        } else {
            finalRecords.push("");
        }
    }

    var currentRecords = finalRecords;
    var currentScore = seatingAutomationHelper(currentRecords, linkedRecordQueries, numTables, numChairs, relationshipFieldId);

    var bestScore = 0;
    var bestRecords = finalRecords;

    var newRecords;
    var newScore = 0;

    /*while (bestScore < (numTables * numChairs * 2 * 0.75) && currentTimes < maxTimes) {

        //rearrange
        newRecords = rearrangeRecords(currentRecords, linkedRecordQueries, numTables, numChairs);

        newScore = seatingAutomationHelper(newRecords, linkedRecordQueries, numTables, numChairs, relationshipFieldId);

        if (currentScore < newScore) {
            currentScore = newScore;
            currentRecords = newRecords;
        } else {

        }

        if (bestScore < newScore) {
            bestScore = newScore;
            bestRecords = newRecords;
        }

        if (bestScore == numTables * numChairs * 2) {
            break;
        }

        currentTimes += 1;
    }*/

    return bestRecords;
}

function rearrangeRecords(records, linkedRecordQueries, numTables, numChairs) {

    var index1 = Math.floor(Math.random() * Math.floor(records.length));
    var index2 = Math.floor(Math.random() * Math.floor(records.length));

    var recordAtIndex1 = records[index1];
    var recordAtIndex2 = records[index2];

    var linkedRecord1 = linkedRecordQueries[index1];
    var linkedRecord2 = records[index2];

    records[index1] = recordAtIndex2;
    records[index2] = recordAtIndex1;

    linkedRecordQueries[index1] = linkedRecord2;
    linkedRecordQueries[index2] = linkedRecord1;

    return records;
}

function seatingAutomationHelper(records, linkedRecordQueries, numTables, numChairs, relationshipFieldId) {
    var score = 0;

    for (var j = 0; j < numTables * numChairs; j++) {
        score += countHappiness(records.slice(j, parseInt(j + numChairs)), linkedRecordQueries);
        console.log("slice: " + j + " : " + j + numChairs);
        j = j + parseInt(numChairs) - 1;
        console.log(j);
    }

    return score;
}

function countHappiness(tableRecords, linkedRecordQueries) {
    var happiness = 0;
    var linkedRecordsCount = 0;

    var tableRecordIds = [];

    for (var k = 0; k < tableRecords.length; k++) {
        if (tableRecords[k].id != null && tableRecords[k].id != "") {
            tableRecordIds.push(tableRecords[k].id);
        }
    }

    console.log(tableRecordIds);

    if (tableRecords.length == 1) {
        return 0;
    } else {
        for (var i = 0; i < tableRecords.length; i++) {
            console.log("here");

            if (tableRecords[i] == null || tableRecords[i] == "" || linkedRecordQueries[i] == null || linkedRecordQueries[i].length == 0) {
                happiness += 2;
            } else {
                console.log("here2");
                console.log(linkedRecordQueries);
                for (var j = 0; j < linkedRecordQueries[i].length; j++) {

                    if (tableRecordsIds.includes(linkedRecordQueries[i].id)) {
                        linkedRecordsCount += 1;
                        console.log("here3");
                    }

                }

                if (linkedRecordsCount == linkedRecordQueries[i].length) {
                    happiness += 2;
                } else if (linkedRecordsCount >= 1) {
                    happiness += linkedRecordsCount;
                } else {

                }
            }
        }
    }
}

// Render the seating chart

function renderSeatingChart(guestNameArray, numTables, numChairs) {

    if (guestNameArray.length == numTables * numChairs) {
        var tableArray = [];

        for (var i = 0; i < numTables; i++) {
            tableArray.push(i);
        }

        var chairArray = [];

        for (var j = 0; j < numChairs; j++) {
            chairArray.push(j);
        }

        var test = 0;

        var formattedRecords =

            tableArray.map((tableValue, tableIndex) => {

                return <div key={tableIndex}><h2>Table {tableValue + 1}</h2><ol>

                {chairArray.map((chairValue, chairIndex) => {

                    return <li key={chairIndex}>{guestNameArray[(tableValue * numChairs) + chairValue]}

                    </li>
                })}

                </ol></div>;
        })

        return <div>
            {formattedRecords}
        </div>;
    } else {
        return "Sorry, the chart can't be generated at this time.";
    }
}

// Save seating chart data to file

function SaveSeatingChartData(props) {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    var records = props.records;
    var numChairs = props.numChairs;
    var numTables = props.numTables;

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

    const base = useBase();
    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const dataTable = base.getTableByIdIfExists(dataTableId);
    const chartNameField = dataTable.getFieldByIdIfExists(chartNameFieldId);

    const [chartName, setChartName] = useState("");

    var buttonDisabled = true;

    if (chartName == "" || chartName == null) {

    } else {
        buttonDisabled = false;
    }

    const [saveData, setSaveData] = useState(false);

    const seatingChartRecords = useRecords(dataTable, {fields: [chartNameFieldId]});

    var chartNameWillBeOverwritten = false;

    var saveCompleted = false;

    if (saveData && !saveCompleted) {
        for (var i = 0; i < seatingChartRecords.length; i++) {
            if (seatingChartRecords[i].getCellValueAsString(chartNameFieldId) == chartName) {
                chartNameWillBeOverwritten = true;
                break;
            } else {

            }
        }
    }

    var savingInProgress = true;

    if (saveData && !chartNameWillBeOverwritten) {
        var recordsToUpdate = [];

        for (var j = 0; j < records.length; j++) {
            if (records[j] != "") {
                recordsToUpdate.push({fields: {
                    [chartNameFieldId]: chartName,
                    [tableNumFieldId]: Math.floor(j / numChairs) + 1,
                    [chairNumFieldId]: (j % numChairs) + 1,
                    [guestNameFieldId]: [{id: records[j].id}]
                }});
            } else {

            }
        }

        saveCompleted = true;
        //savingInProgress = createChartRecords(dataTable, recordsToUpdate);
    }

    const [showHomeScreen, setHomeScreen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />
    } else if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>
            Before proceeding with saving data you must fill out some information.
            <SettingsComponent />

            </div>;
    } else if (saveData && !chartNameWillBeOverwritten && savingInProgress) {
        return <div><Loader scale={0.3} /></div>;
    } else if (saveData && !chartNameWillBeOverwritten && !savingInProgress) {
        return <div>Save Completed
            <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>
        </div>;
    } else {
        return <div>
            <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>

            <FormField label="New Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            <Button onClick={e => setSaveData(true)} disabled={buttonDisabled} icon="upload" variant="primary">
                Save Records
            </Button>

            {chartNameWillBeOverwritten && "That chart name is already in use. Please choose another name."}

            {props.chart}
        </div>;
    }
}

async function createChartRecords(dataTable, recordsToUpdate) {
    //save the data;
    const batchSize = 50;
    var secondNum;

    if (recordsToUpdate.length < 50) {
        dataTable.createRecordsAsync(recordsToUpdate);
    } else {
        var i = 0;
        while (i < recordsToUpdate.length) {
            secondNum = i + batchSize;
            const updateBatch = recordsToUpdate.slice(i, secondNum);

            await dataTable.createRecordsAsync(recordsToUpdate);

            i += batchSize;
        }
    }

    return false;
}

initializeBlock(() => <SeatingChartBlock />);
