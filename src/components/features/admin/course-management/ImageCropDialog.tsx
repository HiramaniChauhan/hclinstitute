import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropDialogProps {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropDone: (croppedImageData: string) => void;
    aspectRatio?: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImageBitmap(await fetch(imageSrc).then(r => r.blob()));
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );
    return canvas.toDataURL("image/jpeg", 0.9);
}

export const ImageCropDialog = ({ open, imageSrc, onClose, onCropDone, aspectRatio = 16 / 9 }: ImageCropDialogProps) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropDone(croppedImage);
            onClose();
        } catch (e) {
            console.error("Crop error:", e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crop Cover Photo</DialogTitle>
                </DialogHeader>

                {/* Crop area */}
                <div className="relative w-full h-72 bg-gray-900 rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                {/* Zoom slider */}
                <div className="px-2 space-y-2 pt-2">
                    <Label className="text-sm text-gray-600">Zoom: {zoom.toFixed(1)}x</Label>
                    <Slider
                        min={1}
                        max={3}
                        step={0.05}
                        value={[zoom]}
                        onValueChange={([val]) => setZoom(val)}
                        className="w-full"
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
                        Apply Crop
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
