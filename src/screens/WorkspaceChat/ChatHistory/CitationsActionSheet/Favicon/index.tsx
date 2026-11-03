import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Globe } from "phosphor-react-native";

/**
 * NexVora AI Workspace never asks a third party for favicons: the upstream app called Google's favicon service
 * with the hostname of every cited page, which would reveal which sites a user's answers cite. A generic globe
 * icon is drawn instead. Always returns null.
 */
export function getFaviconUrl(_url?: string | null): string | null {
    return null;
}

/**
 * Renders the favicon for a URL, falling back to a generic globe icon
 * when the URL is invalid or the favicon fails to load.
 */
export default function Favicon({
    url,
    size = 18,
    fallbackColor = "#22D3EE",
}: {
    url?: string | null;
    size?: number;
    fallbackColor?: string;
}) {
    const faviconUrl = getFaviconUrl(url);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [url]);

    if (!faviconUrl || imgError) return <Globe size={size} color={fallbackColor} />;

    return (
        <View
            style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: "#FFF" }}
            className="flex items-center justify-center"
        >
            <Image
                source={{ uri: faviconUrl }}
                style={{ width: size, height: size }}
                resizeMode="cover"
                onError={() => setImgError(true)}
            />
        </View>
    );
}
