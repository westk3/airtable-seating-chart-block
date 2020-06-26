import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    Input,
    Label,
    FormField,
    FieldPickerSynced,
} from '@airtable/blocks/ui';
import React, {useState} from 'react';

function SeatingChartBlock() {

    const base = useBase();

    const globalConfig = useGlobalConfig();
    const guestTableId = globalConfig.get('guestsTableId');
    const relationshipFieldId = globalConfig.get('relationshipFieldId');

    const guestTable = base.getTableByIdIfExists(guestTableId);
    const relationshipField = guestTable ? guestTable.getFieldByIdIfExists(relationshipFieldId) : null;

    const [numTables, setTableValue] = useState("");
    const [numChairs, setChairValue] = useState("");

    const records = useRecords(guestTable);

    return <div>
        <TablePickerSynced globalConfigKey="guestTableId" />
        <FieldPickerSynced table={guestTable} globalConfigKey="relationshipFieldId" />

        <FormField label="Number of Tables">
            <Input value={numTables} type="number" onChange={e => setTableValue(e.target.numTables)} />
        </FormField>

        <FormField label="Number of Chairs">
            <Input value={numChairs} type="number" onChange={e => setChairValue(e.target.numChairs)} />
        </FormField>
    </div>;
}

//initial setup function

//function to change settings later

//seating automation function

//pull from existing storage

//show on map

//rename seating chart?, drag and drop?, specific view for table?, check permissions

initializeBlock(() => <SeatingChartBlock />);
