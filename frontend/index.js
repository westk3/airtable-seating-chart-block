//test errors for all screens
//test render chart with bad values
//check save with 50+ records, loading table with 50+ records
//when change table problems happen (clear globalconfig?)
//test seating automation with more people
//loading icons?

//add comments

import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    settingsButton,
    useSettingsButton,
    useLoadable,
    useWatchable,
    Text,
    Dialog,
    Icon,
    Heading,
    Box,
    ConfirmationDialog,
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

// Seating Chart block initial screen
function SeatingChartBlock() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    });

    const [showNewChart, setShowNewChart] = useState(false);
    const [loadExistingChart, setLoadExistingChart] = useState(false);

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const dataTable = base.getTableByIdIfExists(dataTableId);

    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const guestTableId = globalConfig.get('guestTableId');
    const guestTable = base.getTableByIdIfExists(guestTableId);

    const relationshipFieldId = globalConfig.get('relationshipFieldId');
    const originalGuestNameFieldId = globalConfig.get('originalGuestNameFieldId');

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // show settings
    if (isShowingSettings || (dataTable == null || chartNameFieldId == null || guestNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null || guestTable == null || relationshipFieldId == null || originalGuestNameFieldId == null)) {
        return <SettingsComponent message="Welcome to the Seating Chart Block. Please fill out these initial settings before using the block. Settings must first be initialized by a user with Editor permissions. You can return to these settings at any time by pressing the settings button in the top right corner." />;

    // show choices to create a new seating chart or load an existing seating chart
    } else if (!showNewChart && !loadExistingChart) {
        return <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    flexDirection="column"
                >
                    <Heading size="large">Seating Chart Block</Heading>
                    <Box position="relative" display="flex" flexDirection="column" alignItems="center" justifyContent="space-around" padding={1} margin={3}>
                        <Button onClick={() => setShowNewChart(true)} marginY={2} icon="cog">
                            Create a New Seating Chart
                            </Button>
                        <Button onClick={() => setLoadExistingChart(true)} marginY={2} icon="download">
                            Load an Existing Seating Chart
                        </Button>
                        <Button onClick={() => setIsDialogOpen(true)} marginY={2} icon="info">About the Seating Chart Block</Button>

                        {isDialogOpen && (
                            <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
                              <Dialog.CloseButton />
                              <Heading>About the Seating Chart Block</Heading>
                              <Text variant="paragraph">
                                The Seating Chart Block is used to create and view automatically generated best-fit seating charts.
                                The charts are automatically generated using given information about how guests are related to each other (stored in a linked record field).
                                After a chart is generated, it may be saved to another table, so you can load that chart to look at it again, edit the chart, or use that data in another visualization block.
                              </Text>
                              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
                            </Dialog>)}
                    </Box>
            </Box>;

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
function SettingsComponent(props) {

    var message = props.message;

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const dataTable = base.getTableByIdIfExists(dataTableId);

    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const guestTableId = globalConfig.get('guestTableId');
    const guestTable = base.getTableByIdIfExists(guestTableId);

    const relationshipFieldId = globalConfig.get('relationshipFieldId');
    const originalGuestNameFieldId = globalConfig.get('originalGuestNameFieldId');

    var dataTableExists = false;
    var guestTableExists = false;

    if (dataTable != null) {
        dataTableExists = true;
    }

    if (guestTable != null) {
        guestTableExists = true;
    }

    return <Box
                position="absolute"
                display="flex"
                alignItems="left"
                justifyContent="flex-start"
                flexDirection="column"
                padding={2}
            >
            <Heading as="h2" size="large" marginY={2}>Settings</Heading>

            <div marginY={1}>{message}</div>

            <Heading marginY={2} borderTop="default" paddingY={1}>Settings to create a new seating chart</Heading>
            <Label htmlFor="guest-table-picker" marginTop={2}>Table that contains guest data</Label>
            <TablePickerSynced id="guest-table-picker" marginBottom={2} globalConfigKey="guestTableId" />

            {guestTableExists && <Label htmlFor="original-guest-name-field-picker" marginTop={2}>Field that contains the name of each guest</Label>}
            {guestTableExists && <FieldPickerSynced id="original-guest-name-field-picker" marginBottom={2} table={guestTable} allowedTypes={[FieldType.SINGLE_LINE_TEXT]} globalConfigKey="originalGuestNameFieldId" />}

            {guestTableExists && <Label htmlFor="relationship-field-picker" marginTop={2}>Field that contains relationship data for each guest (a field that links to other guest records)</Label>}
            {guestTableExists && <FieldPickerSynced id="relationship-field-picker" marginBottom={2} table={guestTable} allowedTypes={[FieldType.MULTIPLE_RECORD_LINKS]} globalConfigKey="relationshipFieldId" />}

        <Heading marginY={2} borderTop="default" paddingY={1}>Settings to save or load a new seating chart</Heading>

        <Label htmlFor="data-table-picker" marginTop={2}>Table to store seating chart data</Label>
        <TablePickerSynced id="data-table-picker" globalConfigKey="dataTableId" marginBottom={2} />

        {dataTableExists && <Label htmlFor="chart-name-field-picker" marginTop={2}>Field that contains the seating chart name</Label>}
        {dataTableExists && <FieldPickerSynced id="chart-name-field-picker" marginBottom={2} table={dataTable} allowedTypes={[FieldType.SINGLE_LINE_TEXT]} globalConfigKey="chartNameFieldId" />}

        {dataTableExists && <Label htmlFor="guest-name-field-picker" marginTop={2}>Field that contains the guest lookup field (a field that links to a record from the guest table)</Label>}
        {dataTableExists && <FieldPickerSynced id="guest-name-field-picker" marginBottom={2} table={dataTable} allowedTypes={[FieldType.MULTIPLE_RECORD_LINKS]} globalConfigKey="guestNameFieldId" />}

        {dataTableExists && <Label htmlFor="table-num-field-picker" marginTop={2}>Field that contains the table number</Label>}
        {dataTableExists && <FieldPickerSynced id="table-num-field-picker" marginBottom={2} table={dataTable} allowedTypes={[FieldType.NUMBER]} globalConfigKey="tableNumFieldId" />}

        {dataTableExists && <Label htmlFor="chair-num-field-picker" marginTop={2}>Field that contains the chair number</Label>}
        {dataTableExists && <FieldPickerSynced id="chair-num-field-picker" marginBottom={2} paddingBottom={2} allowedTypes={[FieldType.NUMBER]} table={dataTable} globalConfigKey="chairNumFieldId" />}

    </Box>;
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

    const guestTable = base.getTableByIdIfExists(guestTableId);

    const numTables = globalConfig.get('numTables');
    const numChairs = globalConfig.get('numChairs');

    // disable Generate Seating Chart button until fields are filled
    const buttonDisabled = numTables <= 0 || numTables == null || numChairs <= 0 ||  numChairs == null || guestTable == null || relationshipFieldId == null || originalGuestNameFieldId == null || generateChart || !globalConfig.hasPermissionToSet("renderRecords") || !globalConfig.hasPermissionToSet("saveRecords");

    // note if number of guests exceeds capacity given
    var errorMessage = "";

    var records = useRecords(guestTable, {fields: [relationshipFieldId, originalGuestNameFieldId]});

    if (numTables == null || numChairs == null || numTables == "" || numChairs == "") {
        errorMessage = "Please fill out all the fields.";
    } else if (records.length < 2) {
        errorMessage = "You must have at least two people on your list to create a seating chart.";
    } else if (!buttonDisabled && numTables != null && numChairs != null && records.length > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list."
    } else if (!globalConfig.hasPermissionToSet("renderRecords") || !globalConfig.hasPermissionToSet("saveRecords")) {
        errorMessage = "You don't have permission to generate a seating chart.";
    }

    const [generateChart, setGenerateChart] = useState(false);

    var finalRecords;
    var nameOnlyFinalRecords = [];
    var idOnlyFinalRecords = [];

    var chart;
    const [chartGenerated, setChartGenerated] = useState(false);

    if (generateChart && !chartGenerated) {

        finalRecords = seatingAutomation(records, numTables, numChairs, relationshipFieldId);

        for (var k = 0; k < finalRecords.length; k++) {
            if (finalRecords[k] != "") {
                nameOnlyFinalRecords.push(finalRecords[k].getCellValueAsString(originalGuestNameFieldId));
                idOnlyFinalRecords.push(finalRecords[k].id);
            } else {
                nameOnlyFinalRecords.push("");
                idOnlyFinalRecords.push("");
            }
        }
    }

    useEffect(() => {
        if (generateChart && !chartGenerated) {
            globalConfig.setAsync("renderRecords", nameOnlyFinalRecords);
            globalConfig.setAsync("saveRecords", idOnlyFinalRecords);

            setChartGenerated(true);
            setGenerateChart(false);
        }
    });

    if (chartGenerated) {
        nameOnlyFinalRecords = globalConfig.get("renderRecords");
        idOnlyFinalRecords = globalConfig.get("saveRecords");
    }

    chart = renderSeatingChart(nameOnlyFinalRecords, numTables, numChairs);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saveChartData, setSaveChartData] = useState(false);
    const [showHomeScreen, setHomeScreen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />;
    } else if (guestTable == null || relationshipFieldId == null || originalGuestNameFieldId == null) {
        return <SettingsComponent message="Before proceeding with creating a new chart, fill out the appropriate section. You can open or close Settings at any time with the button on the top right of your screen." />;
    } else if (saveChartData) {
        return <SaveSeatingChartData records={idOnlyFinalRecords} numChairs={numChairs} numTables={numTables} chart={chart} />;
    } else {

        return <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    flexDirection="column"
                >

                <Box
                    position="absolute"
                    display="flex"
                    alignItems="left"
                    justifyContent="flex-start"
                    flexDirection="column"
                    maxWidth="500px"
                    width="100%"
                    marginX="auto"
                    padding={2}
                >
                    {!chartGenerated && <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>}
                    {chartGenerated && <Button onClick={(e) => {setIsDialogOpen(true)} } icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>}
                    <Heading size="large" as="h2" marginY={3}>New seating chart</Heading>
                {isDialogOpen && <ConfirmationDialog
                    title="Are you sure you want to leave without saving?"
                    body="If you leave without saving, you won't be able to access this chart again."
                    confirmButtonText="Continue without saving"
                    onConfirm={() => {
                        setIsDialogOpen(false);
                        setHomeScreen(true);
                    }}
                    onCancel={() => setIsDialogOpen(false)}
                />}
            {!chartGenerated && <FormField label="Number of Tables">
                <InputSynced type="number" min="1" required={true} globalConfigKey="numTables" />
            </FormField>}

            {!chartGenerated && <FormField label="Number of Chairs">
                <InputSynced required={true} min="1" type="number" globalConfigKey="numChairs" />
            </FormField>}

            {!chartGenerated && <Box padding={2}>{errorMessage}</Box>}
            {!chartGenerated && <Button onClick={e => setGenerateChart(true)} disabled={buttonDisabled} icon="personalAuto" variant="primary">
                Generate Seating Chart
            </Button>}

            {chartGenerated && <Button onClick={() => setSaveChartData(true)} variant="primary" icon="upload">
                Save Chart
            </Button>}

            {chartGenerated && chart}

        </Box>

        </Box>;
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
    const [errorMessage, setErrorMessage] = useState("");

    var chart;

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
            setErrorMessage("That chart could not be found. Please try a different name.");
            setRenderChart(false);
        } else {

            chart = renderSeatingChart(guestNameArray, maxTableNum, maxChairNum);
        }
    }

    const [showHomeScreen, setHomeScreen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />
    } else if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <SettingsComponent message="Before proceeding with loading saved data, fill out the appropriate section. You can open or close Settings at any time using the button on the top right of your screen."/>;
    } else {
        return <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    flexDirection="column"
                >

                <Box
                    position="absolute"
                    display="flex"
                    alignItems="left"
                    justifyContent="flex-start"
                    flexDirection="column"
                    maxWidth="500px"
                    width="100%"
                    marginX="auto"
                    padding={2}
                >
                <Button onClick={(e) => setHomeScreen(true)} icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>
                <Heading size="large" as="h2" marginY={3}>Load seating chart</Heading>

            {!renderChart && <FormField label="Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>}

            {!renderChart && <Box padding={2}>{errorMessage}</Box>}

            {!renderChart && <Button marginTop={1} onClick={e => setRenderChart(true)} disabled={buttonDisabled} icon="download" variant="primary">
                Load Chart
            </Button>}

            {renderChart && <div>{chart}</div>}

            </Box>

        </Box>;
    }

}

// Seating chart automatic creation function

function seatingAutomation(records, numTables, numChairs, relationshipFieldId) {

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
    var currentScore = seatingAutomationHelper(currentRecords, numTables, numChairs, relationshipFieldId);

    var bestScore = currentScore;
    var bestRecords = finalRecords;

    var newRecords;
    var newScore = 0;

    while (bestScore < (numTables * numChairs * 2 * 0.75) && currentTimes < maxTimes) {

        newRecords = rearrangeRecords(currentRecords, numTables, numChairs);

        newScore = seatingAutomationHelper(newRecords, numTables, numChairs, relationshipFieldId);

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
    }

    return bestRecords;
}

function rearrangeRecords(records, numTables, numChairs) {

    var index1 = Math.floor(Math.random() * Math.floor(records.length));
    var index2 = Math.floor(Math.random() * Math.floor(records.length));

    var recordAtIndex1 = records[index1];
    var recordAtIndex2 = records[index2];

    records[index1] = recordAtIndex2;
    records[index2] = recordAtIndex1;

    return records;
}

function seatingAutomationHelper(records, numTables, numChairs, relationshipFieldId) {
    var score = 0;

    for (var j = 0; j < numTables * numChairs; j++) {
        score += countHappiness(records.slice(j, j + parseInt(numChairs)), relationshipFieldId);

        j = j + parseInt(numChairs) - 1;

    }

    return score;
}

function countHappiness(tableRecords, relationshipFieldId) {
    var happiness = 0;
    var linkedRecordsCount = 0;

    var linkedRecords;

    var tableRecordIds = [];

    for (var k = 0; k < tableRecords.length; k++) {
        if (tableRecords[k] != null && tableRecords[k] != "") {
            tableRecordIds.push(tableRecords[k].id);
        }
    }

    if (tableRecords.length == 1) {

    } else {

        for (var i = 0; i < tableRecords.length; i++) {
            linkedRecordsCount = 0;

            if (tableRecords[i] == null || tableRecords[i] == "") {
                happiness += 2;

            } else {

                linkedRecords = tableRecords[i].getCellValue(relationshipFieldId);

                if (linkedRecords == null || linkedRecords.length == 0) {
                    happiness += 2;

                } else {
                    for (var j = 0; j < linkedRecords.length; j++) {

                        if (tableRecordIds.includes(linkedRecords[j].id)) {
                            linkedRecordsCount += 1;
                        }

                    }

                    if (linkedRecordsCount == linkedRecords.length) {
                        happiness += 2;
                    } else if (linkedRecordsCount >= 1) {
                        happiness += linkedRecordsCount;
                    } else {

                    }
                }
            }
        }
    }
    return happiness;
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
    } else if (guestNameArray == null || guestNameArray == ""){
        return "";
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
    var chart = props.chart;

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

    const [chartNameWillBeOverwritten, setChartNameWillBeOverwritten] = useState(false);

    const [saveCompleted, setSaveCompleted] = useState(false);

    const [checkSaveData, setCheckSaveData] = useState(false);

    var recordsToUpdate = [];

    if (checkSaveData && !saveData) {

        var overwritten = false;
        for (var i = 0; i < seatingChartRecords.length; i++) {

            if (seatingChartRecords[i].getCellValueAsString(chartNameFieldId) == chartName) {

                overwritten = true;

                break;
            } else {

            }
        }

        if (!overwritten) {
            setSaveData(true);
            setChartNameWillBeOverwritten(false);
        } else {
            setChartNameWillBeOverwritten(true);
            setCheckSaveData(false);
        }
    }

    if (saveData && !saveCompleted) {

        for (var j = 0; j < records.length; j++) {
            if (records[j] != "" && records[j] != null) {
                recordsToUpdate.push({fields: {
                    [chartNameFieldId]: chartName,
                    [tableNumFieldId]: Math.floor(j / numChairs) + 1,
                    [chairNumFieldId]: (j % numChairs) + 1,
                    [guestNameFieldId]: [{id: records[j]}]
                }});
            } else {

            }
        }


        //createChartRecords(dataTable, recordsToUpdate);
        setSaveCompleted(true);
    }

    const [showHomeScreen, setHomeScreen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (showHomeScreen) {
        return <SeatingChartBlock />
    } else if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>

            <SettingsComponent message="Before proceeding to save data, you must fill out information in the appropriate section. You can open or close Settings at any time using the button on the top right of your screen." />

            </div>;
    } else if (saveData && !chartNameWillBeOverwritten && saveCompleted) {
        return <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    flexDirection="column"
                >

                <Box
                    position="absolute"
                    display="flex"
                    alignItems="left"
                    justifyContent="flex-start"
                    flexDirection="column"
                    maxWidth="500px"
                    width="100%"
                    marginX="auto"
                    padding={2}
                >
                <Heading as="h2" marginY={2} size="large">Save successful</Heading>
                <Box padding={2} marginBottom={3}>Your chart was successfully saved.</Box>
            <Button onClick={(e) => setHomeScreen(true)} variant="primary" icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>
            </Box>
        </Box>;
    } else {
        return <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    flexDirection="column"
                >

                <Box
                    position="absolute"
                    display="flex"
                    alignItems="left"
                    justifyContent="flex-start"
                    flexDirection="column"
                    maxWidth="500px"
                    width="100%"
                    marginX="auto"
                    padding={2}
                >
                <Button onClick={(e) => {setIsDialogOpen(true)} } icon="chevronLeft" aria-label="Back to Home Screen">Back to Home Screen</Button>
            <Heading size="large" as="h2" marginY={2}>Save seating chart</Heading>
            {isDialogOpen && <ConfirmationDialog
                title="Are you sure you want to leave without saving?"
                body="If you leave without saving, you won't be able to access this chart again."
                confirmButtonText="Continue without saving"
                onConfirm={() => {
                    setIsDialogOpen(false);
                    setHomeScreen(true);
                }}
                onCancel={() => setIsDialogOpen(false)}
            />}

            <FormField label="New Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            {chartNameWillBeOverwritten && <Box padding={2}>That chart name is already in use. Please choose another name.</Box>}

            <Button onClick={e => setCheckSaveData(true)} disabled={buttonDisabled} icon="upload" variant="primary">
                Save Chart
            </Button>

            {chart}
        </Box></Box>;
    }
}

async function createChartRecords(dataTable, recordsToUpdate) {

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
