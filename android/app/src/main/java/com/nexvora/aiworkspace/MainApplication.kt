package com.nexvora.aiworkspace

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.nexvora.aiworkspace.download.DownloadPackage
import com.nexvora.aiworkspace.storage.StoragePackage
import com.nexvora.aiworkspace.vector.VectorBoxPackage
import com.nexvora.aiworkspace.webscraper.WebScraperPackage
import com.nexvora.aiworkspace.pdfparser.PdfParserPackage
import com.nexvora.aiworkspace.scheduledjobs.ScheduledJobsPackage
import com.nexvora.aiworkspace.sharedcontent.SharedContentPackage
import com.nexvora.aiworkspace.quickcontext.QuickContextPackage
import com.nexvora.aiworkspace.assistant.AssistantPackage
import com.nexvora.aiworkspace.messaging.MessagingPackage
import com.nexvora.aiworkspace.alarms.AlarmPackage
import com.nexvora.aiworkspace.loopbackauth.LoopbackAuthPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(DeviceInfoPackage())
              add(KeepAwakePackage())
              add(ScreenLockPackage())
              add(DownloadPackage())
              add(StoragePackage())
              add(VectorBoxPackage())
              add(WebScraperPackage())
              add(PdfParserPackage())
              add(ScheduledJobsPackage())
              add(SharedContentPackage())
              add(QuickContextPackage())
              add(AssistantPackage())
              add(MessagingPackage())
              add(AlarmPackage())
              add(LoopbackAuthPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
