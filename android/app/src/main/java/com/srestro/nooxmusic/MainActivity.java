package com.srestro.nooxmusic;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.srestro.nooxmusic.NooxDownloaderPlugin;


public class MainActivity extends BridgeActivity {
    public void onCreate(Bundle savedInstanceState) {
        
        registerPlugin(NooxDownloaderPlugin.class);
    
        super.onCreate(savedInstanceState);
    }
}
