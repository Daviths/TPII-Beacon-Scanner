package com.example.david.bleapp;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.ParcelUuid;
import android.support.annotation.RequiresApi;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.ToggleButton;

import junit.framework.Assert;

import java.util.UUID;
import java.util.regex.Matcher;

public class MainActivity extends AppCompatActivity{

    private static final String TAG = "Debug";
    private static final int SCAN_PERIOD = 1000 * 5; //Milisegundos que se escanea por beacons
    private BluetoothAdapter mBluetoothAdapter;
    private final static int REQUEST_ENABLE_BT = 1;
    private Handler mHandler, sHandler;
    boolean mScanning, sScanning;
    private static  final int ColorTexto = Color.GRAY;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);


        // Initializes Bluetooth adapter.
        final BluetoothManager bluetoothManager =
                (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        mBluetoothAdapter = bluetoothManager.getAdapter();

        if (mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
        }

        mHandler = new Handler();
        sHandler = new Handler();

        sScanning = false;
    }

    public void updateTextView(final String toThis, final int id_text, final int color) {

        runOnUiThread(new Runnable() {
            public void run() {
                TextView textView = (TextView) findViewById(id_text);
                textView.setText(toThis); //, TextView.BufferType.SPANNABLE
                textView.setTextColor(color);
                textView.postInvalidate();
                Log.d(TAG, "updateTextView: Actualizado a "+toThis);
            }
        });
    }

    public double calculateDistance(int txPower, double rssi) {
        if (rssi == 0) {
            return -1.0; // if we cannot determine accuracy, return -1.
        }
        double ratio = rssi*1.0/txPower;
        if (ratio < 1.0) {
            double tmp = (Math.pow(ratio,10));
            tmp *=100;
            tmp = Math.round(tmp);
            tmp /=100;
            return tmp;
        }
        else {
            double accuracy =  ((0.89976)*Math.pow(ratio,7.7095) + 0.111);
            accuracy *=100;
            accuracy = Math.round(accuracy);
            accuracy /=100;
            return accuracy;
        }
    }

    private BluetoothAdapter.LeScanCallback mLeScanCallback = new BluetoothAdapter.LeScanCallback() {
        @RequiresApi(api = Build.VERSION_CODES.KITKAT)
        @Override
        public void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
            //
            if(device.getName() != null){
                Log.d(TAG, "onLeScan: "+device.getAddress());
                Log.d(TAG, "onLeScan: "+device.getName());
                Log.d(TAG, "onLeScan: "+device.getType());
                Log.d(TAG, "onLeScan: "+rssi);
                Log.d(TAG, "onLeScan: "+scanRecord);
                Log.d(TAG, "onLeScan: Mayor: "+String.valueOf( (scanRecord[25] & 0xff) * 0x100 + (scanRecord[26] & 0xff)));
                Log.d(TAG, "onLeScan: Menor: "+String.valueOf( (scanRecord[27] & 0xff) * 0x100 + (scanRecord[28] & 0xff)));
                Log.d(TAG, "onLeScan: TxPower" + (scanRecord[29] & 0xff));
                Log.d(TAG, "onLeScan: TxPower" + (scanRecord[29]));
                updateTextView("Nombre: "+device.getName(), R.id.Nombre , ColorTexto);
                updateTextView("Potencia: "+ rssi +" | Distancia: "+calculateDistance(scanRecord[29], rssi) +" m.", R.id.Potencia, ColorTexto);
                updateTextView("Mayor : "+String.valueOf( (scanRecord[25] & 0xff) * 0x100 + (scanRecord[26] & 0xff)), R.id.Mayor, ColorTexto);
                updateTextView("Menor: "+String.valueOf( (scanRecord[27] & 0xff) * 0x100 + (scanRecord[28] & 0xff)), R.id.Menor, ColorTexto);
                updateTextView("Direccion: "+device.getAddress(), R.id.Address, ColorTexto);
                for(int i = 0; i < scanRecord.length; i++) {
                    if (i + 7 < scanRecord.length) {
                        //Since V522
                       if ((scanRecord[i] == (byte)0x07) && (scanRecord[i + 1] == (byte)0x16) && (scanRecord[i + 2] == (byte)0x00) && (scanRecord[i + 3] == (byte)0xB0)) {
                            Log.d(TAG, "onLeScan: FLAG: " + (scanRecord[i + 4] & 1));
                           if((scanRecord[i + 4] & 1)==1) {
                               updateTextView("ROJO", R.id.Flag, Color.RED);
                           }else{
                               updateTextView("VERDE", R.id.Flag, Color.GREEN);
                           }
                        }
                    }
                }
                Log.d(TAG, "onLeScan: largoScanRecord: "+scanRecord.length);
                //Log.d(TAG, "scanRecord: "+ String.format("%02X ", scanRecord[48]));   //07
                //Log.d(TAG, "scanRecord: "+ String.format("%02X ", scanRecord[49]));   //16
                //Log.d(TAG, "scanRecord: "+ String.format("%02X ", scanRecord[50]));   //00
                //Log.d(TAG, "scanRecord: "+ String.format("%02X ", scanRecord[51]));   //B0
                //Log.d(TAG, "scanRecord: "+ String.format("%02X ", (scanRecord[52] & 0x01))); Valor del Flag, es 0x30 o 0x31, solo el ultimo bit es el flag
                Log.d(TAG, "onLeScan: Encontrado");
                Log.d(TAG, "onLeScan: Llamada funcion");
            }
        }
    };

    @SuppressWarnings( "deprecation" )
    public void bScanClick(View view){
        //mBluetoothAdapter.startLeScan(mLeScanCallback);
        //updateTextView("Estado: Escaneando", R.id.Estado);
        mScanning = true;
        if (mScanning) {
            // Stops scanning after a pre-defined scan period.
            mHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    mScanning = false;
                    mBluetoothAdapter.stopLeScan(mLeScanCallback);
                    updateTextView("Estado: Detenido", R.id.Estado, ColorTexto);
                }
            }, SCAN_PERIOD);

            mScanning = true;
            mBluetoothAdapter.startLeScan(mLeScanCallback);
            updateTextView("Estado: Escaneando", R.id.Estado, ColorTexto);
        } else {
            mScanning = false;
            mBluetoothAdapter.stopLeScan(mLeScanCallback);
            updateTextView("Estado: Detenido", R.id.Estado, ColorTexto);
        }
        /*mBluetoothAdapter.startLeScan(mLeScanCallback);
        updateTextView("Estado: Escaneando", R.id.Estado);*/
    }
    @SuppressWarnings("deprecation")
    public void bStopClick(View view){
        mBluetoothAdapter.stopLeScan(mLeScanCallback);
        updateTextView("Estado: Detenido", R.id.Estado, ColorTexto);
    }

    @SuppressWarnings("deprecation")
    public void bToggleScan(View view){
        ToggleButton tb = (ToggleButton) findViewById(R.id.toggleButton);
        if(tb.isChecked()){
            //mBluetoothAdapter.startLeScan(mLeScanCallback);
            updateTextView("Estado: Escaneando", R.id.Estado, ColorTexto);
            sScanning = true;
            sHandler.postDelayed(runnableCode, 100);
        }else{
            mBluetoothAdapter.stopLeScan(mLeScanCallback);
            sScanning = false;
            updateTextView("Estado: Detenido", R.id.Estado, ColorTexto);
        }
    }

    private Runnable runnableCode = new Runnable() {
        @SuppressWarnings("deprecation")
        @Override
        public void run() {
            // Do something here on the main thread
            Log.d("Handlers", "Called on main thread");
            mBluetoothAdapter.stopLeScan(mLeScanCallback);
            if(sScanning){
                mBluetoothAdapter.startLeScan(mLeScanCallback);
                sHandler.postDelayed(runnableCode, 1000);
            }
        }
    };



    /* REQUIERE API 21 MINIMO :(
    private ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            Integer cant = 0;
            for(ScanResult result: results){
                cant++;
            }
            updateTextView(cant.toString(), R.id.Flag);
        }
    };

    public void bScanClick(View view){
        mBluetoothAdapter.getBluetoothLeScanner().startScan(scanCallback);
    }

    public void bStopClick(View view){
        mBluetoothAdapter.getBluetoothLeScanner().stopScan(scanCallback);
    }*/
}
